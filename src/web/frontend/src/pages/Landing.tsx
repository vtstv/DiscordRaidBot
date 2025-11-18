// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/Landing.tsx
// Landing page for unauthenticated users
import { useAuth } from '../contexts/AuthContext';
import './Landing.css';

export default function Landing() {
  const { login } = useAuth();

  return (
    <div className="landing">
      <div className="landing-hero">
        <h1 className="landing-title">🛡️ RaidBot</h1>
        <p className="landing-subtitle">
          Professional Discord Event Management System
        </p>
        <p className="landing-description">
          Organize raids, events, and activities with ease. Manage participants,
          templates, and schedules all in one place.
        </p>
        <button className="btn-primary btn-large" onClick={login}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
          Login with Discord
        </button>
      </div>

      <div className="landing-features">
        <h2>Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3>Event Scheduling</h3>
            <p>Create and manage events with customizable dates, times, and participant limits</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Participant Management</h3>
            <p>Track signups, manage roles, and organize participants efficiently</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📋</div>
            <h3>Event Templates</h3>
            <p>Save time with reusable templates for recurring events</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔔</div>
            <h3>Reminders</h3>
            <p>Automatic reminders before events start to keep everyone informed</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚙️</div>
            <h3>Flexible Configuration</h3>
            <p>Customize settings per server with role-based permissions</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Statistics</h3>
            <p>Track event participation and server activity with detailed stats</p>
          </div>
        </div>
      </div>
    </div>
  );
}
