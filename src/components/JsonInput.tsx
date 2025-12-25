'use client';

import React, { useState } from 'react';

interface JsonInputProps {
  onLoad: (data: any) => void;
}

export default function JsonInput({ onLoad }: JsonInputProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const handleLoad = () => {
    try {
      if (!text.trim()) return;
      const parsed = JSON.parse(text);
      setError('');
      onLoad(parsed);
    } catch (e: any) {
      setError('Invalid JSON: ' + e.message);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-sm font-semibold text-gray-700">JSON Input</h2>
        <button 
          onClick={handleLoad}
          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
        >
          Load Data
        </button>
      </div>
      <textarea
        className="flex-1 w-full p-2 text-xs font-mono border rounded resize-none focus:ring-2 focus:ring-blue-500 outline-none"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='[{"id": 1, "user": {"name": "Alice"}}]'
      />
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
    </div>
  );
}
