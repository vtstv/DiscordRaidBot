import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';

interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userName: string;
  guildId: string;
  guildName: string;
  details: string | any; // Can be string or object
  timestamp: string;
}

export default function AuditLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    action: 'all',
    guildId: '',
    userId: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    loadLogs();
  }, [page, filters]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(filters.action !== 'all' && { action: filters.action }),
        ...(filters.guildId && { guildId: filters.guildId }),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
      });

      const response = await fetch(`/api/admin/audit-logs?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to load audit logs');
      
      const data = await response.json();
      setLogs(data.logs || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Audit logs error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      'EVENT_CREATE': 'bg-green-500/20 text-green-300',
      'EVENT_UPDATE': 'bg-blue-500/20 text-blue-300',
      'EVENT_DELETE': 'bg-red-500/20 text-red-300',
      'TEMPLATE_CREATE': 'bg-purple-500/20 text-purple-300',
      'TEMPLATE_UPDATE': 'bg-indigo-500/20 text-indigo-300',
      'TEMPLATE_DELETE': 'bg-orange-500/20 text-orange-300',
      'USER_JOIN': 'bg-cyan-500/20 text-cyan-300',
      'USER_LEAVE': 'bg-pink-500/20 text-pink-300',
    };
    return colors[action] || 'bg-gray-500/20 text-gray-300';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
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
          <h1 className="text-3xl font-bold text-white">Audit Logs</h1>
          <p className="text-purple-200 mt-2">System-wide activity tracking</p>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Action Type
              </label>
              <select
                value={filters.action}
                onChange={(e) => {
                  setFilters({ ...filters, action: e.target.value });
                  setPage(1);
                }}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Actions</option>
                <option value="EVENT_CREATE">Event Create</option>
                <option value="EVENT_UPDATE">Event Update</option>
                <option value="EVENT_DELETE">Event Delete</option>
                <option value="TEMPLATE_CREATE">Template Create</option>
                <option value="TEMPLATE_UPDATE">Template Update</option>
                <option value="TEMPLATE_DELETE">Template Delete</option>
                <option value="USER_JOIN">User Join</option>
                <option value="USER_LEAVE">User Leave</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Guild ID
              </label>
              <input
                type="text"
                value={filters.guildId}
                onChange={(e) => {
                  setFilters({ ...filters, guildId: e.target.value });
                  setPage(1);
                }}
                placeholder="Filter by guild..."
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                User ID
              </label>
              <input
                type="text"
                value={filters.userId}
                onChange={(e) => {
                  setFilters({ ...filters, userId: e.target.value });
                  setPage(1);
                }}
                placeholder="Filter by user..."
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Date From
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => {
                  setFilters({ ...filters, dateFrom: e.target.value });
                  setPage(1);
                }}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Date To
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => {
                  setFilters({ ...filters, dateTo: e.target.value });
                  setPage(1);
                }}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-6">
            Activity Log {logs.length > 0 && `(${logs.length} records)`}
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No audit logs found
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                            {log.action.replace(/_/g, ' ')}
                          </span>
                          <span className="text-sm text-gray-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-white font-medium mb-1">
                          {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>User: {log.userName || log.userId}</span>
                          <span>•</span>
                          <span>Guild: {log.guildName || log.guildId}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-white px-4">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        <Footer />
      </div>
    </div>
  );
}
