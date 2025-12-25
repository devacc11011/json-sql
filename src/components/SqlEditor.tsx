'use client';

import React, { useEffect, useRef } from 'react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import { ColumnSchema } from '../lib/schema';

interface SqlEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  schema: ColumnSchema[];
  tableName?: string;
}

export default function SqlEditor({ value, onChange, schema, tableName = 't' }: SqlEditorProps) {
  const monacoRef = useRef<Monaco | null>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    monacoRef.current = monaco;

    // Register SQL completion provider
    monaco.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions = [
          // Table name
          {
            label: tableName,
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: tableName,
            range,
          },
          // Keywords
          ...['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'LIMIT', 'COUNT', 'SUM', 'AVG', 'LIKE', 'IN', 'IS NULL'].map(kw => ({
            label: kw,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: kw,
            range,
          })),
          // Columns
          ...schema.map(col => ({
            label: col.name,
            kind: monaco.languages.CompletionItemKind.Field,
            detail: col.type,
            documentation: `Sample: ${JSON.stringify(col.sample)}`,
            // Auto-quote if contains dots or spaces
            insertText: /^[a-zA-Z0-9_]+$/.test(col.name) ? col.name : `"${col.name}"`,
            range,
          }))
        ];

        return { suggestions };
      }
    });
  };

  // Update suggestions when schema changes? 
  // The provider is registered once. Ideally we dispose old one or use a mutable ref for schema within the closure.
  // For this simple demo, we just rely on the closure capturing `schema` if we re-register, 
  // but monaco registers globally.
  // Better approach: use a ref for schema that the provider reads.
  const schemaRef = useRef(schema);
  useEffect(() => { schemaRef.current = schema; }, [schema]);

  // We need to re-implement the provider to use the ref, 
  // OR the `handleEditorDidMount` needs to define the provider to read `schemaRef.current`.
  // Since `handleEditorDidMount` runs once, let's fix the provider there to read from Ref.
  
  // Actually, the provider defined above captures the initial `schema`.
  // We need to modify the provider to use `schemaRef.current`.
  
  useEffect(() => {
    if (monacoRef.current) {
      // Dispose old providers if we were managing disposables (advanced).
      // For now, simple reload or just accept that the provider uses the ref.
      // The code in handleEditorDidMount needs to use schemaRef.current!
    }
  }, [schema]);

  return (
    <div className="h-full w-full border rounded-md overflow-hidden">
      <Editor
        height="100%"
        defaultLanguage="sql"
        value={value}
        onChange={onChange}
        onMount={(editor, monaco) => {
          monacoRef.current = monaco;
          monaco.languages.registerCompletionItemProvider('sql', {
            provideCompletionItems: (model, position) => {
              const currentSchema = schemaRef.current; // Access latest schema
              const word = model.getWordUntilPosition(position);
              const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn,
              };

              const suggestions = [
                {
                  label: tableName,
                  kind: monaco.languages.CompletionItemKind.Class,
                  insertText: tableName,
                  range,
                },
                ...['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'LIMIT', 'COUNT', 'SUM', 'AVG', 'LIKE', 'IN', 'IS NULL'].map(kw => ({
                  label: kw,
                  kind: monaco.languages.CompletionItemKind.Keyword,
                  insertText: kw,
                  range,
                })),
                ...currentSchema.map(col => ({
                  label: col.name,
                  kind: monaco.languages.CompletionItemKind.Field,
                  detail: col.type,
                  documentation: `Sample: ${JSON.stringify(col.sample)}`,
                  insertText: /^[a-zA-Z0-9_]+$/.test(col.name) ? col.name : `"${col.name}"`,
                  range,
                }))
              ];
              return { suggestions };
            }
          });
        }}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
}
