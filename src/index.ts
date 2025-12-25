export { default as JsonSqlSearch } from './components/JsonSqlSearch';
export { flattenJson } from './lib/flatten';
export { inferSchema } from './lib/schema';
export { initDuckDB, executeQuery } from './lib/sqlEngine';
export type { ColumnSchema } from './lib/schema';
