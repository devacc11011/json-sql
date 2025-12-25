'use client';

import JsonSqlSearch from '../components/JsonSqlSearch';

// Define local bundles for demo usage to avoid CDN issues in dev environment
const LOCAL_BUNDLES = {
  mvp: {
    mainModule: '/duckdb/duckdb-mvp.wasm',
    mainWorker: '/duckdb/duckdb-browser-mvp.worker.js',
  },
  eh: {
    mainModule: '/duckdb/duckdb-eh.wasm',
    mainWorker: '/duckdb/duckdb-browser-eh.worker.js',
  },
};

export default function Home() {
  return (
    <main className="h-screen w-screen overflow-hidden">
      <JsonSqlSearch duckdbBundles={LOCAL_BUNDLES} />
    </main>
  );
}
