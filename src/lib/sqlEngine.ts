import * as duckdb from '@duckdb/duckdb-wasm';
import { FlatRow } from './flatten';

let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;
let initPromise: Promise<duckdb.AsyncDuckDB> | null = null;

// Default to CDN bundles for library usage
const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

export async function initDuckDB(customBundles?: duckdb.DuckDBBundles) {
  if (db) return db;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Use custom bundles if provided, otherwise default to CDN
      const bundles = customBundles || JSDELIVR_BUNDLES;
      
      console.log('[DuckDB] Selecting bundle...');
      const bundle = await duckdb.selectBundle(bundles);
      console.log('[DuckDB] Bundle selected:', bundle);
      
      const mainWorkerUrl = bundle.mainWorker!;
      let workerUrl = mainWorkerUrl;
      let isBlobWorker = false;

      // Handle Cross-Origin Worker for CDN URLs
      if (mainWorkerUrl.startsWith('http')) {
        console.log('[DuckDB] Creating Blob worker shim...');
        const blob = new Blob([`importScripts("${mainWorkerUrl}");`], { type: 'application/javascript' });
        workerUrl = URL.createObjectURL(blob);
        isBlobWorker = true;
      }

      const worker = new Worker(workerUrl);
      const logger = new duckdb.ConsoleLogger();
      
      const newDb = new duckdb.AsyncDuckDB(logger, worker);
      
      console.log('[DuckDB] Instantiating...');
      // Instantiate needs the original URL or WASM path to locate assets
      // If bundle.mainModule (WASM path) is present, use it. Otherwise rely on mainWorker logic.
      const wasmPath = bundle.mainModule || bundle.mainWorker;
      
      const instantiatePromise = newDb.instantiate(wasmPath, bundle.pthreadWorker);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Instantiation timed out (20s)')), 20000));
      
      await Promise.race([instantiatePromise, timeoutPromise]);
      console.log('[DuckDB] Instantiated.');
      
      if (isBlobWorker) {
          URL.revokeObjectURL(workerUrl);
      }
      
      console.log('[DuckDB] Connecting...');
      conn = await newDb.connect();
      console.log('[DuckDB] Connected.');
      
      db = newDb;
      return db;
    } catch (err) {
      console.error('[DuckDB] Init failed:', err);
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
}

export async function loadTable(rows: FlatRow[], tableName: string = 't') {
  if (!db || !conn) await initDuckDB();
  if (!conn) throw new Error("Database connection failed");

  // Create table from JSON
  // DuckDB-WASM's insertJSON is a helper that handles creating a table and inserting data
  // However, flattened keys with dots might need quoting or special handling if we want them to be columns.
  // "user.profile.name" as a column name is valid in SQL if quoted: "user.profile.name"
  
  // We need to ensure the table schema matches our rows. 
  // insertJSON automatically infers schema.
  
  await conn.query(`DROP TABLE IF EXISTS "${tableName}"`);

  // Alternative: Write JSON to a virtual file and load it
  const jsonContent = JSON.stringify(rows);
  const fileName = `${tableName}.json`;
  
  await db!.registerFileText(fileName, jsonContent);
  
  // Create table using read_json_auto
  await conn.query(`CREATE TABLE "${tableName}" AS SELECT * FROM read_json_auto('${fileName}')`);
  
  // Optional: Cleanup file? Not strictly necessary in memory DB but good practice if repeated
  // await db!.registerFileText(fileName, ''); 
}

export async function executeQuery(sql: string) {
  if (!conn) throw new Error("Database not connected");
  
  const result = await conn.query(sql);
  
  // Convert Arrow result to JSON array for UI
  return result.toArray().map((row) => row.toJSON());
}

export function formatError(err: any): string {
  const msg = err.message || String(err);
  if (msg.includes("Parser Error")) {
    return `SQL Syntax Error: ${msg.split('\n')[0]}`;
  }
  return msg;
}
