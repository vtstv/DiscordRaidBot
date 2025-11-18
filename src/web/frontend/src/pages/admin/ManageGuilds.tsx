import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';

interface Guild {
  id: string;
  name: string;
  memberCount: number;
  eventCount?: number;
  templateCount?: number;
  isActive: boolean;
  joinedAt?: string;
  _count?: {
    events: number;
    templates: number;
  };
}

export default function ManageGuilds() {
  const navigate = useNavigate();
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    loadGuilds();
  }, []);

  const loadGuilds = async () => {
    try {
      const response = await fetch('/api/admin/guilds', {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to load guilds');
      
      const data = await response.json();
      setGuilds(data || []);
    } catch (error) {
      console.error('Guilds error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGuildData = async (guildId: string, guildName: string) => {
    if (!confirm(`Are you sure you want to delete all data for "${guildName}"? This will remove all events, templates, and settings. This action cannot be undone!`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/guilds/${guildId}/data`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete guild data');
      
      alert('Guild data deleted successfully!');
      loadGuilds();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete guild data. Please try again.');
    }
  };

  const filteredGuilds = guilds
    .filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()) || g.id.includes(searchQuery))
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'members':
          return (b.memberCount || 0) - (a.memberCount || 0);
        case 'events':
          return (b._count?.events || b.eventCount || 0) - (a._count?.events || a.eventCount || 0);
        case 'joined':
          if (!a.joinedAt) return 1;
          if (!b.joinedAt) return -1;
          return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
        default:
          return 0;
      }
    });

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
          <h1 className="text-3xl font-bold text-white">Manage Guilds</h1>
          <p className="text-purple-200 mt-2">View and manage all connected Discord servers</p>
        </div>

        {/* Controls */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guilds by name or ID..."
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full md:w-auto px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="name">Sort by Name</option>
                <option value="members">Sort by Members</option>
                <option value="events">Sort by Events</option>
                <option value="joined">Sort by Join Date</option>
              </select>
            </div>
          </div>
        </div>

        {/* Guilds Grid */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-6">
            Connected Guilds {filteredGuilds.length > 0 && `(${filteredGuilds.length})`}
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredGuilds.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              {searchQuery ? 'No guilds found matching your search' : 'No guilds connected'}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredGuilds.map((guild) => (
                <div
                  key={guild.id}
                  className="bg-white/5 rounded-lg p-6 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">{guild.name}</h3>
                      <p className="text-sm text-gray-400 font-mono">{guild.id}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      guild.isActive ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'
                    }`}>
                      {guild.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <p className="text-2xl font-bold text-purple-300">{guild.memberCount || 0}</p>
                      <p className="text-xs text-gray-400 mt-1">Members</p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <p className="text-2xl font-bold text-blue-300">{guild._count?.events || guild.eventCount || 0}</p>
                      <p className="text-xs text-gray-400 mt-1">Events</p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <p className="text-2xl font-bold text-green-300">{guild._count?.templates || guild.templateCount || 0}</p>
                      <p className="text-xs text-gray-400 mt-1">Templates</p>
                    </div>
                  </div>

                  <div className="text-sm text-gray-400 mb-4">
                    Joined: {guild.joinedAt ? new Date(guild.joinedAt).toLocaleDateString() : 'Unknown'}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/guild/${guild.id}`)}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleDeleteGuildData(guild.id, guild.name)}
                      className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg font-medium hover:bg-red-500/30 transition-colors"
                    >
                      Delete Data
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <Footer />
      </div>
    </div>
  );
}
