import * as duckdb from '@duckdb/duckdb-wasm';
import { FlatRow } from './flatten';

let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;

const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

export async function initDuckDB() {
  if (db) return db;

  // Select the best bundle for the browser
  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
  
  const worker = new Worker(bundle.mainWorker!);
  const logger = new duckdb.ConsoleLogger();
  
  db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainWorker, bundle.pthreadWorker);
  
  conn = await db.connect();
  return db;
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
