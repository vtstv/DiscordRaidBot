import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PanelSelect() {
  const navigate = useNavigate();
  const { user, isBotAdmin, adminGuilds } = useAuth();

  useEffect(() => {
    // Redirect if not bot admin
    if (!isBotAdmin) {
      if (adminGuilds && adminGuilds.length > 0) {
        navigate('/servers');
      } else {
        navigate('/');
      }
    }
  }, [isBotAdmin, adminGuilds, navigate]);

  if (!isBotAdmin || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome, {user.username}!
          </h1>
          <p className="text-xl text-purple-200">
            As a bot administrator, you have access to both panels. Choose where you want to go:
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Bot Admin Panel */}
          <div
            onClick={() => navigate('/a')}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Bot Admin Panel</h2>
              <p className="text-purple-200 mb-6">
                Global bot administration: manage all servers, system settings, and statistics
              </p>
              <ul className="text-left text-purple-100 space-y-2 mb-6">
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>All servers access</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>Global search and analytics</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>System configuration</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>Bulk operations</span>
                </li>
              </ul>
              <div className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-full font-semibold group-hover:shadow-lg group-hover:shadow-pink-500/50 transition-shadow">
                Open Bot Admin →
              </div>
            </div>
          </div>

          {/* Guild Admin Panel */}
          <div
            onClick={() => navigate('/servers')}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Guild Admin Panel</h2>
              <p className="text-purple-200 mb-6">
                Manage your Discord servers: events, templates, and server-specific settings
              </p>
              <ul className="text-left text-purple-100 space-y-2 mb-6">
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>Your servers only</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>Event management</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>Template creation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>Server settings</span>
                </li>
              </ul>
              <div className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-semibold group-hover:shadow-lg group-hover:shadow-purple-500/50 transition-shadow">
                Choose Server →
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/')}
            className="text-purple-300 hover:text-white transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
