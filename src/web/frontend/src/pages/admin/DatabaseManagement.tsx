// Copyright (c) 2025 Murr (https://github.com/vtstv)
// Database backup and restore UI

import React, { useState, useEffect } from 'react';

interface DatabaseStats {
  databaseSize: string;
  tables: Array<{
    schema: string;
    table: string;
    rows: number;
  }>;
}

export default function DatabaseManagement() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/database/stats', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load database stats:', error);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/database/export', { method: 'POST' });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `raidbot-backup-${new Date().toISOString()}.sql`;

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({ type: 'success', text: `Database exported successfully: ${filename}` });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to export database' });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm('⚠️ WARNING: Importing a database dump will OVERWRITE all existing data. Are you sure you want to continue?')) {
      event.target.value = '';
      return;
    }

    setImporting(true);
    setMessage(null);

    try {
      // Read file as text
      const fileContent = await file.text();

      const response = await fetch('/api/admin/database/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: fileContent,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setMessage({ type: 'success', text: `Database imported successfully from ${file.name}` });
      
      // Reload stats after import
      setTimeout(() => {
        loadStats();
      }, 1000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to import database' });
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Messages */}
      {message && (
        <div className={`p-4 rounded-lg flex items-start gap-3 ${
          message.type === 'success' ? 'bg-green-500/20 border border-green-500/30' :
          message.type === 'error' ? 'bg-red-500/20 border border-red-500/30' :
          'bg-blue-500/20 border border-blue-500/30'
        }`}>
          <span className="text-xl">
            {message.type === 'success' ? '✅' : message.type === 'error' ? '❌' : 'ℹ️'}
          </span>
          <p className={`text-sm ${
            message.type === 'success' ? 'text-green-300' :
            message.type === 'error' ? 'text-red-300' :
            'text-blue-300'
          }`}>{message.text}</p>
        </div>
      )}

      {/* Database Statistics */}
      <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span>📊</span>
          Database Statistics
        </h2>
        
        {stats ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded">
              <span className="text-sm font-medium text-gray-300">Database Size:</span>
              <span className="text-lg font-bold text-blue-400">{stats.databaseSize}</span>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Tables:</h3>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {stats.tables.map((table, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded text-sm">
                    <span className="text-gray-100 font-mono">{table.table}</span>
                    <span className="text-gray-400">{table.rows.toLocaleString()} rows</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-400">Loading statistics...</p>
        )}
      </div>

      {/* Export/Import Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Export */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">⬇️</span>
            Export Database
          </h2>
          
          <p className="text-sm text-gray-400 mb-4">
            Download a complete backup of the database in SQL format. This includes all tables, data, and schema.
          </p>

          <button
            onClick={handleExport}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Exporting...
              </>
            ) : (
              <>
                <span className="text-xl">⬇️</span>
                Export Database
              </>
            )}
          </button>
        </div>

        {/* Import */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">⬆️</span>
            Import Database
          </h2>
          
          <div className="bg-red-500/20 border border-red-500/30 rounded p-3 mb-4">
            <div className="flex items-start gap-2">
              <span className="text-xl">⚠️</span>
              <p className="text-sm text-red-300">
                <strong>Warning:</strong> Importing will overwrite all existing data. Create a backup first!
              </p>
            </div>
          </div>

          <label className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer">
            {importing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Importing...
              </>
            ) : (
              <>
                <span className="text-xl">⬆️</span>
                Select SQL File to Import
              </>
            )}
            <input
              type="file"
              accept=".sql"
              onChange={handleImport}
              disabled={importing}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Best Practices */}
      <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-100 mb-3 flex items-center gap-2">
          <span className="text-xl">💡</span>
          Best Practices
        </h3>
        <ul className="space-y-2 text-sm text-blue-200">
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>Create regular backups before major changes or updates</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400">•</span>
            <span>Store backups in a secure, off-site location</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>Test restore procedures periodically to ensure backups work</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>Always export a backup before importing new data</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
