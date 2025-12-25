'use client';

import React, { useEffect, useRef } from 'react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import { ColumnSchema } from '../lib/schema';

interface SqlEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  schema: ColumnSchema[];
  tableName?: string;
  onRun?: () => void;
}

export default function SqlEditor({ value, onChange, schema, tableName = 't', onRun }: SqlEditorProps) {
  const monacoRef = useRef<Monaco | null>(null);
  const schemaRef = useRef(schema);
  
  useEffect(() => { schemaRef.current = schema; }, [schema]);

  return (
    <div className="h-full w-full border rounded-md overflow-hidden">
      <Editor
        height="100%"
        defaultLanguage="sql"
        value={value}
        onChange={onChange}
        onMount={(editor, monaco) => {
          monacoRef.current = monaco;
          
          // Register Cmd+Enter (Mac) or Ctrl+Enter (Win/Linux) to run query
          if (onRun) {
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
              onRun();
            });
          }

          // Register completion provider
          monaco.languages.registerCompletionItemProvider('sql', {
            provideCompletionItems: (model, position) => {
              const currentSchema = schemaRef.current; 
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
