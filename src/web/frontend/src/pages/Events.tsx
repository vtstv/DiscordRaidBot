// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/Events.tsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, Event } from '../services/api';
import Layout from '../components/Layout';
import Footer from '../components/Footer';

export default function Events() {
  const { guildId } = useParams<{ guildId: string }>();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (guildId) {
      api.getEvents(guildId).then(setEvents).finally(() => setLoading(false));
    }
  }, [guildId]);

  if (loading) return <Layout><div className="loading">Loading events...</div></Layout>;

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1>Events</h1>
        <button
          onClick={() => navigate(`/guild/${guildId}/events/create`)}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all"
        >
          + Create Event
        </button>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Status</th>
              <th>Participants</th>
            </tr>
          </thead>
          <tbody>
            {events.map(event => (
              <tr 
                key={event.id}
                onClick={() => navigate(`/guild/${guildId}/events/${event.id}`)}
                className="cursor-pointer hover:bg-white/5 transition-colors"
              >
                <td>{event.title}</td>
                <td>{new Date(event.startTime).toLocaleString()}</td>
                <td><span className={`badge ${event.status}`}>{event.status}</span></td>
                <td>{event._count?.participants || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Footer />
    </Layout>
  );
}
