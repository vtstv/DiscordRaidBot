// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/components/Layout.tsx

import { ReactNode } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGuild } from '../contexts/GuildContext';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { guildId } = useParams<{ guildId: string }>();
  const { user, logout } = useAuth();
  const { selectedGuild } = useGuild();
  const navigate = useNavigate();

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>{selectedGuild?.name || 'RaidBot'}</h2>
          <button className="btn-secondary btn-sm" onClick={() => navigate('/servers')}>
            Change Server
          </button>
        </div>
        <div className="nav-links">
          <Link to={`/guild/${guildId}/dashboard`} className="nav-link">
            📊 Dashboard
          </Link>
          <Link to={`/guild/${guildId}/events`} className="nav-link">
            📅 Events
          </Link>
          <Link to={`/guild/${guildId}/templates`} className="nav-link">
            📋 Templates
          </Link>
          <Link to={`/guild/${guildId}/settings`} className="nav-link">
            ⚙️ Settings
          </Link>
        </div>
        <div className="sidebar-footer">
          <div className="user-info">
            <span>{user?.username}</span>
            <button className="btn-secondary btn-sm" onClick={logout}>Logout</button>
          </div>
        </div>
      </nav>
      <main className="main-content">
        <div className="container">
          {children}
        </div>
      </main>
    </div>
  );
}
