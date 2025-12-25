# JSON SQL Search

A lightweight React component library for querying JSON data using SQL directly in the browser, powered by **DuckDB-WASM**.

Flatten nested JSON structures automatically and run complex SQL queries (SELECT, WHERE, GROUP BY, etc.) without a server.

## Features

- 🚀 **Client-side SQL**: Powered by DuckDB-WASM for high performance.
- 📦 **Zero-config**: Automatically flattens nested JSON objects to dot-notation columns (e.g., `user.address.city`).
- 🛠 **Schema Inference**: Auto-detects column types (string, number, date, boolean).
- 📝 **Monaco Editor**: Integrated SQL editor with auto-completion for table names and columns.
- ⚛️ **React Ready**: Drop-in component for Next.js, Vite, or Create React App.

## Installation

```bash
npm install json-sql-search @duckdb/duckdb-wasm @monaco-editor/react apache-arrow
```

> Note: Peer dependencies (`react`, `react-dom`) must also be installed.

## Usage

### 1. Basic Component

Import `JsonSqlSearch` and use it in your application.

```tsx
import React from 'react';
import { JsonSqlSearch } from 'json-sql-search';

const data = [
  { id: 1, user: { name: "Alice", age: 25 } },
  { id: 2, user: { name: "Bob", age: 30 } }
];

function App() {
  return (
    <div style={{ height: '100vh' }}>
      <JsonSqlSearch initialData={data} />
    </div>
  );
}

export default App;
```

### 2. Advanced Usage (Headless)

You can use the core logic functions separately if you want to build your own UI.

```tsx
import { flattenJson, inferSchema, initDuckDB, executeQuery } from 'json-sql-search';

async function processData(jsonData) {
  // 1. Flatten Data
  const flatRows = flattenJson(jsonData);
  
  // 2. Infer Schema
  const schema = inferSchema(flatRows);
  console.log(schema);

  // 3. Load into DuckDB
  const db = await initDuckDB();
  const conn = await db.connect();
  
  await db.registerFileText('data.json', JSON.stringify(flatRows));
  await conn.query(`CREATE TABLE my_table AS SELECT * FROM read_json_auto('data.json')`);

  // 4. Query
  const result = await conn.query("SELECT * FROM my_table WHERE \"user.age\" > 20");
  console.log(result.toArray());
}
```

## Props (`JsonSqlSearch`)

| Prop | Type | Description |
|Data | `any` | Initial JSON data to load (Object or Array). |
| className | `string` | Optional CSS class for the container. |

## Querying Guide

- The default table name is `t`.
- Nested keys become dot-notation columns.
- **Important**: Columns with dots must be quoted in SQL (e.g., `"user.name"`).

**Example SQL:**
```sql
SELECT "user.name", count(*) as count 
FROM t 
GROUP BY 1 
ORDER BY count DESC
```

## License

MIT

```