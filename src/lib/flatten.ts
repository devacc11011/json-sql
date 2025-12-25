export type FlatRow = Record<string, any>;

/**
 * Flattens a nested JSON object or array of objects into a flat structure with dot-notation keys.
 * Adds a `_row_id` to each top-level item to track identity.
 */
export function flattenJson(data: any): FlatRow[] {
  if (!data) return [];

  // Normalize to array
  const rows = Array.isArray(data) ? data : [data];

  return rows.map((row, index) => {
    const flat: FlatRow = { _row_id: index + 1 };
    flattenRecursive(row, '', flat);
    return flat;
  });
}

function flattenRecursive(
  obj: any,
  prefix: string,
  result: FlatRow
) {
  if (obj === null || obj === undefined) {
    // Decision: Explicitly set null for known keys? 
    // For sparse data, we usually just omit the key, but to be explicit we could set null.
    // Here we omit undefined, set null if it was explicitly null.
    if (obj === null && prefix) {
      result[prefix] = null;
    }
    return;
  }

  const type = typeof obj;

  if (type === 'string' || type === 'number' || type === 'boolean') {
    if (prefix) result[prefix] = obj;
    return;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      if (prefix) result[prefix] = []; // Empty array representation
      return;
    }
    
    // Arrays: map to index keys e.g. "items[0]"
    obj.forEach((item, i) => {
      const newKey = prefix ? `${prefix}[${i}]` : `[${i}]`; // Should not happen at root usually
      flattenRecursive(item, newKey, result);
    });
    return;
  }

  if (type === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) {
      if (prefix) result[prefix] = {};
      return;
    }

    keys.forEach((key) => {
      const newKey = prefix ? `${prefix}.${key}` : key;
      flattenRecursive(obj[key], newKey, result);
    });
    return;
  }

  // Fallback for symbols, functions (shouldn't be in JSON)
  if (prefix) result[prefix] = String(obj);
}
