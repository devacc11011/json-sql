import React from 'react';

interface ResultTableProps {
  data: any[];
  error?: string | null;
}

export default function ResultTable({ data, error }: ResultTableProps) {
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <div className="p-4 text-gray-500 text-sm text-center">No results or no query executed.</div>;
  }

  const columns = Object.keys(data[0]);

  return (
    <div className="flex-1 overflow-auto border rounded relative">
      <table className="min-w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-gray-100 sticky top-0 z-10">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-4 py-2 border-b font-medium text-gray-700">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 border-b last:border-0">
              {columns.map((col) => (
                <td key={`${i}-${col}`} className="px-4 py-1.5 text-gray-800">
                  {formatCell(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatCell(value: any) {
  if (value === null || value === undefined) return <span className="text-gray-400">NULL</span>;
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  return String(value);
}
