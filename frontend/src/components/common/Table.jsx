import React from 'react';

const Table = ({ 
  columns = [], 
  data = [], 
  className = '',
  variant = 'default',
  size = 'md'
}) => {
  const variants = {
    default: 'table-3d bg-glass-light backdrop-blur-xl',
    solid: 'bg-white/10 backdrop-blur-xl border border-pastel-blue/20',
    accent: 'bg-pastel-pink/10 backdrop-blur-xl border border-pastel-pink/20'
  };

  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  if (!data.length) {
    return (
      <div className={`${variants[variant]} rounded-2xl p-8 text-center`}>
        <p className="text-white/60">No data available</p>
      </div>
    );
  }

  return (
    <div className={`${variants[variant]} rounded-2xl overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className={`w-full ${sizes[size]}`}>
          <thead>
            <tr className="bg-gradient-to-r from-pastel-blue/30 to-pastel-mint/30">
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-6 py-4 text-left font-semibold text-white border-b border-white/10"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-6 py-4 text-white/90"
                  >
                    {cell === null || cell === undefined ? (
                      <span className="text-white/40 italic">NULL</span>
                    ) : (
                      cell.toString()
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
