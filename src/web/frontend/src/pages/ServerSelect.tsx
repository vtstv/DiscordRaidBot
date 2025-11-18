// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/ServerSelect.tsx
// Server selection page

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGuild } from '../contexts/GuildContext';
import api, { Guild } from '../services/api';
import './ServerSelect.css';

export default function ServerSelect() {
  const { user, logout } = useAuth();
  const { setSelectedGuild } = useGuild();
  const navigate = useNavigate();
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGuilds();
  }, []);

  const loadGuilds = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminGuilds();
      // These are already filtered admin guilds from the backend
      setGuilds(data.guilds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load servers');
    } finally {
      setLoading(false);
    }
  };

  const selectGuild = (guild: Guild) => {
    setSelectedGuild(guild);
    navigate(`/guild/${guild.id}/dashboard`);
  };

  if (loading) {
    return <div className="loading">Loading servers...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="server-select">
      <header className="server-select-header">
        <h1>Select a Server</h1>
        <div className="user-info">
          <span>{user?.username}</span>
          <button className="btn-secondary" onClick={logout}>Logout</button>
        </div>
      </header>

      {guilds.length === 0 ? (
        <div className="no-servers">
          <p>No servers found where you can manage the bot.</p>
          <p>Make sure:</p>
          <ul>
            <li>You have MANAGE_GUILD or ADMINISTRATOR permissions</li>
            <li>The bot is invited to the server</li>
          </ul>
        </div>
      ) : (
        <div className="guilds-grid">
          {guilds.map(guild => (
            <div key={guild.id} className="guild-card" onClick={() => selectGuild(guild)}>
              {guild.icon ? (
                <img 
                  src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                  alt={guild.name}
                  className="guild-icon"
                />
              ) : (
                <div className="guild-icon-placeholder">
                  {guild.name.charAt(0).toUpperCase()}
                </div>
              )}
              <h3>{guild.name}</h3>
              {guild.owner && <span className="badge-owner">Owner</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
