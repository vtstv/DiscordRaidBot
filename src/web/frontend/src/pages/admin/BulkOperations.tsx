import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';

interface BulkOperation {
  type: 'delete_old_events' | 'archive_completed' | 'cleanup_orphaned' | 'reset_guild_settings';
  label: string;
  description: string;
  dangerous: boolean;
}

const OPERATIONS: BulkOperation[] = [
  {
    type: 'delete_old_events',
    label: 'Delete Old Events',
    description: 'Remove events older than specified days across all guilds',
    dangerous: true,
  },
  {
    type: 'archive_completed',
    label: 'Archive Completed Events',
    description: 'Archive all completed events to reduce database load',
    dangerous: false,
  },
  {
    type: 'cleanup_orphaned',
    label: 'Cleanup Orphaned Data',
    description: 'Remove participants and data from deleted events',
    dangerous: false,
  },
  {
    type: 'reset_guild_settings',
    label: 'Reset Guild Settings',
    description: 'Reset all guilds to default settings (keeps events and templates)',
    dangerous: true,
  },
];

export default function BulkOperations() {
  const navigate = useNavigate();
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [daysOld, setDaysOld] = useState(90);
  const [executing, setExecuting] = useState(false);

  const handleExecute = async () => {
    if (!selectedOperation) {
      alert('Please select an operation');
      return;
    }

    const operation = OPERATIONS.find(op => op.type === selectedOperation);
    if (!operation) return;

    const confirmMessage = operation.dangerous
      ? `⚠️ WARNING: This is a dangerous operation!\n\n${operation.description}\n\nAre you absolutely sure you want to proceed? This action cannot be undone!`
      : `${operation.description}\n\nProceed with this operation?`;

    if (!confirm(confirmMessage)) return;

    setExecuting(true);
    try {
      const response = await fetch('/api/admin/bulk-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          operation: selectedOperation,
          params: {
            daysOld: selectedOperation === 'delete_old_events' ? daysOld : undefined,
          },
        }),
      });

      if (!response.ok) throw new Error('Operation failed');
      
      const result = await response.json();
      alert(`Operation completed successfully!\n\nAffected records: ${result.affectedCount || 0}`);
      setSelectedOperation(null);
    } catch (error) {
      console.error('Bulk operation error:', error);
      alert('Operation failed. Please check the logs and try again.');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/a')}
            className="text-purple-300 hover:text-white transition-colors mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-white">Bulk Operations</h1>
          <p className="text-purple-200 mt-2">Perform mass operations across the system</p>
          <div className="mt-4 p-4 bg-orange-500/20 border border-orange-500/30 rounded-lg">
            <p className="text-orange-300 text-sm flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>
                <strong>Warning:</strong> These operations affect the entire system and cannot be undone. 
                Always create a backup before performing dangerous operations.
              </span>
            </p>
          </div>
        </div>

        {/* Operations List */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Available Operations</h2>
          <div className="space-y-4">
            {OPERATIONS.map((operation) => (
              <div
                key={operation.type}
                onClick={() => setSelectedOperation(operation.type)}
                className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedOperation === operation.type
                    ? 'bg-purple-500/20 border-purple-500'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                } ${operation.dangerous ? 'border-l-4 border-l-red-500' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <input
                    type="radio"
                    checked={selectedOperation === operation.type}
                    onChange={() => setSelectedOperation(operation.type)}
                    className="mt-1 w-5 h-5 accent-purple-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-semibold">{operation.label}</h3>
                      {operation.dangerous && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded-full font-medium">
                          Dangerous
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">{operation.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Parameters */}
        {selectedOperation === 'delete_old_events' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-8">
            <h2 className="text-xl font-bold text-white mb-6">Operation Parameters</h2>
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Delete events older than (days)
              </label>
              <input
                type="number"
                value={daysOld}
                onChange={(e) => setDaysOld(parseInt(e.target.value))}
                min="1"
                max="365"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Events completed more than {daysOld} days ago will be permanently deleted
              </p>
            </div>
          </div>
        )}

        {/* Execute Button */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold mb-1">Ready to execute?</h3>
              <p className="text-sm text-gray-400">
                {selectedOperation 
                  ? `Selected: ${OPERATIONS.find(op => op.type === selectedOperation)?.label}`
                  : 'Please select an operation above'}
              </p>
            </div>
            <button
              onClick={handleExecute}
              disabled={!selectedOperation || executing}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {executing ? 'Executing...' : 'Execute Operation'}
            </button>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
