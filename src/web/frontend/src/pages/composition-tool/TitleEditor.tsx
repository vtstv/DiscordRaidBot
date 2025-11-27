// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/composition-tool/TitleEditor.tsx

import { useState } from 'react';

interface TitleEditorProps {
  title: string;
  onSave: (newTitle: string) => void;
}

export default function TitleEditor({ title, onSave }: TitleEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(title);

  const handleSave = () => {
    onSave(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyPress={(e) => e.key === 'Enter' && handleSave()}
        className="text-2xl font-bold px-3 py-1 border-2 border-purple-300 dark:border-purple-500 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        autoFocus
      />
    );
  }

  return (
    <h1
      onClick={() => setIsEditing(true)}
      className="text-2xl font-bold text-gray-900 dark:text-white cursor-pointer hover:text-purple-600 dark:hover:text-purple-400"
      title="Click to edit title"
    >
      {title || 'Raid Composition - Event'}
    </h1>
  );
}
