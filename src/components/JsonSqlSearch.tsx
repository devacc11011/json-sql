import React, { useState, useEffect, Suspense } from 'react';
// import dynamic from 'next/dynamic'; // Removed to avoid Next.js dependency in lib
import JsonInput from './JsonInput';
import ResultTable from './ResultTable';
import { flattenJson } from '../lib/flatten';
import { inferSchema, ColumnSchema } from '../lib/schema';
import { initDuckDB, loadTable, executeQuery, formatError } from '../lib/sqlEngine';

// Lazy load Monaco Editor
const SqlEditor = React.lazy(() => import('./SqlEditor'));

export interface JsonSqlSearchProps {
  initialData?: any;
  className?: string;
}

export default function JsonSqlSearch({ initialData, className }: JsonSqlSearchProps) {
  const [schema, setSchema] = useState<ColumnSchema[]>([]);
  const [sql, setSql] = useState('SELECT * FROM t LIMIT 100');
  const [result, setResult] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDbReady, setIsDbReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    initDuckDB().then(() => setIsDbReady(true)).catch(console.error);
  }, []);

  useEffect(() => {
    if (initialData && isDbReady) {
        handleJsonLoad(initialData);
    }
  }, [initialData, isDbReady]);

  const handleJsonLoad = async (data: any) => {
    try {
      setIsLoading(true);
      const flat = flattenJson(data);
      const newSchema = inferSchema(flat);
      setSchema(newSchema);
      await loadTable(flat, 't');
      await runQuery('SELECT * FROM t LIMIT 100');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const runQuery = async (querySql: string) => {
    try {
      setError(null);
      const res = await executeQuery(querySql);
      setResult(res);
    } catch (e: any) {
      setError(formatError(e));
    }
  };

  return (
    <div className={`flex flex-col h-full w-full bg-white text-slate-900 ${className || ''}`}>
      <header className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
        <h1 className="font-bold text-lg text-slate-700">JSON SQL Search</h1>
        <div className="text-xs text-gray-500">
          {isDbReady ? '🟢 Engine Ready' : '🔴 Initializing...'}
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Input & Schema */}
        <aside className="w-1/3 min-w-[300px] border-r flex flex-col bg-gray-50 p-4 gap-4">
          <div className="flex-1 flex flex-col min-h-0">
            <JsonInput onLoad={handleJsonLoad} />
          </div>
          <div className="flex-1 flex flex-col min-h-0 border-t pt-4">
            <h3 className="font-semibold text-sm mb-2">Columns</h3>
            <div className="overflow-y-auto flex-1 bg-white border rounded p-2 text-xs">
              <ul className="space-y-1">
                {schema.map(col => (
                  <li key={col.name} className="flex items-center justify-between group">
                    <span 
                      className="font-mono text-blue-700 cursor-pointer hover:underline"
                      title={JSON.stringify(col.sample)}
                      onClick={() => setSql(prev => prev + ` "${col.name}" `)}
                    >
                      {col.name}
                    </span>
                    <span className="text-gray-400 text-[10px]">{col.type}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* Right Content: Editor & Results */}
        <section className="flex-1 flex flex-col min-w-0">
          <div className="h-1/3 min-h-[200px] border-b flex flex-col relative">
            <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-b">
               <span className="text-xs font-semibold text-gray-600">SQL Query</span>
               <button 
                onClick={() => runQuery(sql)}
                className="bg-green-600 text-white px-4 py-1 rounded text-xs hover:bg-green-700 font-bold"
                disabled={!isDbReady}
              >
                Run
              </button>
            </div>
            <div className="flex-1 relative">
               <Suspense fallback={<div className="flex items-center justify-center h-full">Loading Editor...</div>}>
                 <SqlEditor 
                   value={sql} 
                   onChange={(val) => setSql(val || '')} 
                   schema={schema}
                 />
               </Suspense>
            </div>
            {isLoading && (
                 <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-20">
                   <span className="text-sm font-bold animate-pulse">Processing...</span>
                 </div>
            )}
          </div>

          <div className="flex-1 flex flex-col min-h-0 bg-white">
             <ResultTable data={result} error={error} />
          </div>
        </section>
      </div>
    </div>
  );
}
