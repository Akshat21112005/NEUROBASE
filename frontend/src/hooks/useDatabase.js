import { useState, useCallback } from 'react';
import apiService from '../services/api';

export const useDatabase = () => {
  const [databases, setDatabases] = useState([]);
  const [selectedDb, setSelectedDb] = useState('');
  const [loading, setLoading] = useState(false);

  const loadDatabases = useCallback(async () => {
    setLoading(true);
    try {
      const dbs = await apiService.listCSVs();
      setDatabases(Array.isArray(dbs) ? dbs : []);
      if (dbs.length > 0 && !selectedDb) {
        setSelectedDb(dbs[0].id);
      }
    } catch (error) {
      throw new Error(`Failed to load databases: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [selectedDb]);

  const uploadFile = useCallback(async (file) => {
    setLoading(true);
    try {
      const result = await apiService.uploadFile(file);
      await loadDatabases();
      if (result.db_id) {
        setSelectedDb(result.db_id);
      }
      return result;
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [loadDatabases]);

  const deleteDatabase = useCallback(async (dbId) => {
    const dbToDelete = databases.find(db => db.id === dbId);
    if (!window.confirm(`Delete "${dbToDelete?.name}"? This cannot be undone.`)) {
      return false;
    }
    
    setLoading(true);
    try {
      await apiService.deleteCSV(dbId);
      await loadDatabases();
      if (selectedDb === dbId) {
        const remaining = databases.filter(db => db.id !== dbId);
        setSelectedDb(remaining.length > 0 ? remaining[0].id : '');
      }
      return dbToDelete?.name;
    } catch (error) {
      throw new Error(`Delete failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [databases, selectedDb, loadDatabases]);

  const getDatabaseInfo = useCallback(async (dbId) => {
    setLoading(true);
    try {
      const info = await apiService.getDatabaseInfo(dbId);
      return info;
    } catch (error) {
      throw new Error(`Failed to load database info: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    databases,
    selectedDb,
    loading,
    setSelectedDb,
    loadDatabases,
    uploadFile,
    deleteDatabase,
    getDatabaseInfo
  };
};
