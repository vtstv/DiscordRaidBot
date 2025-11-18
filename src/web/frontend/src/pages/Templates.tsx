// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/frontend/src/pages/Templates.tsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, Template } from '../services/api';
import Layout from '../components/Layout';
import Footer from '../components/Footer';

export default function Templates() {
  const { guildId } = useParams<{ guildId: string }>();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (guildId) {
      api.getTemplates(guildId).then(setTemplates).finally(() => setLoading(false));
    }
  }, [guildId]);

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await api.deleteTemplate(templateId);
      setTemplates(templates.filter(t => t.id !== templateId));
    } catch (error) {
      alert('Failed to delete template');
    }
  };

  if (loading) return <Layout><div className="loading">Loading templates...</div></Layout>;

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1>Templates</h1>
        <button
          onClick={() => navigate(`/guild/${guildId}/templates/create`)}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all"
        >
          + Create Template
        </button>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map(template => (
              <tr key={template.id}>
                <td>{template.name}</td>
                <td>{template.description || '-'}</td>
                <td>{new Date(template.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/guild/${guildId}/templates/${template.id}/edit`)}
                      className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded hover:bg-purple-500/30 transition-colors text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="px-3 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded hover:bg-red-500/30 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Footer />
    </Layout>
  );
}
