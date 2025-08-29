import { useState, useCallback } from 'react';
import apiService from '../services/api';

export const useQuery = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentQueries, setRecentQueries] = useState([]);
  const [queryRefinements, setQueryRefinements] = useState([]);

  const executeQuery = useCallback(async (question, dbId) => {
    if (!question.trim() || !dbId) {
      throw new Error('Question and database ID are required');
    }

    setLoading(true);
    setQueryRefinements([]);
    
    try {
      const queryResult = await apiService.query(question, dbId);
      setResult(queryResult);
      
      // Add to recent queries (keep last 5)
      setRecentQueries(prev => {
        const newQueries = [question, ...prev.filter(q => q !== question)].slice(0, 5);
        return newQueries;
      });
      
      // Generate query refinements
      try {
        const refinements = await apiService.suggestRefinements(question, dbId, queryResult.data?.length || 0);
        if (refinements && refinements.suggestions && refinements.suggestions.length > 0) {
          setQueryRefinements(refinements.suggestions);
        }
      } catch (refinementError) {
        // Could not generate query refinements - continuing without suggestions
      }
      
      return queryResult;
    } catch (error) {
      throw new Error(`Query failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setQueryRefinements([]);
  }, []);

  const clearRecentQueries = useCallback(() => {
    setRecentQueries([]);
  }, []);

  return {
    result,
    loading,
    recentQueries,
    queryRefinements,
    executeQuery,
    clearResult,
    clearRecentQueries,
    setResult
  };
};
