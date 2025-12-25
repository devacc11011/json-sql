import { FlatRow } from './flatten';

export interface ColumnSchema {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array' | 'null' | 'mixed';
  sample: any;
}

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/;

export function inferSchema(rows: FlatRow[]): ColumnSchema[] {
  const columnMap = new Map<string, ColumnSchema>();

  // Scan all rows to find all possible columns
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      const value = row[key];
      const currentSchema = columnMap.get(key);
      const detectedType = detectType(value);

      if (!currentSchema) {
        columnMap.set(key, {
          name: key,
          type: detectedType,
          sample: value
        });
      } else {
        // Type Refinement
        if (currentSchema.type === 'null' && detectedType !== 'null') {
          currentSchema.type = detectedType;
          currentSchema.sample = value;
        } else if (currentSchema.type !== 'mixed' && currentSchema.type !== detectedType && detectedType !== 'null') {
          // If types conflict (e.g. number vs string), mark as mixed or fallback to string
          // Simple heuristic: if one is number and other is string, treat as string? 
          // For now, let's mark 'mixed' or just keep the first non-null type to simplify.
          // Let's coerce to string if conflict.
           currentSchema.type = 'string'; 
        }
      }
    }
  }

  // Convert map to array and sort by name
  return Array.from(columnMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function detectType(value: any): ColumnSchema['type'] {
  if (value === null || value === undefined) return 'null';
  
  const type = typeof value;
  
  if (type === 'number') return 'number';
  if (type === 'boolean') return 'boolean';
  if (type === 'object') {
    if (Array.isArray(value)) return 'array';
    return 'object';
  }
  
  if (type === 'string') {
    if (ISO_DATE_REGEX.test(value)) return 'date';
    return 'string';
  }

  return 'string';
}
