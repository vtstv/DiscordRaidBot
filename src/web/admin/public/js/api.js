// API module
const API = {
  async get(endpoint) {
    const response = await fetch(endpoint, {
      credentials: 'include', // Send cookies
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json();
  },

  async post(endpoint, data) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include', // Send cookies
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json();
  },

  async delete(endpoint, data) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include', // Send cookies
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json();
  }
};

// Statistics
async function loadStats() {
  try {
    const data = await API.get('/api/admin/stats');
    
    document.getElementById('statServers').textContent = data.database.totalGuilds;
    document.getElementById('statEvents').textContent = data.database.totalEvents;
    document.getElementById('statActiveEvents').textContent = data.database.activeEvents;
    document.getElementById('statTemplates').textContent = data.database.totalTemplates;
    document.getElementById('statParticipants').textContent = data.database.totalParticipants;
    
    if (data.bot) {
      const days = Math.floor(data.bot.uptime / 86400);
      document.getElementById('statUptime').textContent = days;
      document.getElementById('sysBotServers').textContent = data.bot.guilds;
      document.getElementById('sysBotUsers').textContent = data.bot.users.toLocaleString();
      document.getElementById('sysBotPing').textContent = data.bot.ping;
    }
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

// Servers
async function loadServers() {
  try {
    const servers = await API.get('/api/admin/guilds');
    const tbody = document.getElementById('serversTable');
    
    if (servers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty">No servers found</td></tr>';
      return;
    }

    tbody.innerHTML = servers.map(server => `
      <tr>
        <td><strong>${escapeHtml(server.name)}</strong></td>
        <td>${server.memberCount.toLocaleString()}</td>
        <td>${server._count.events}</td>
        <td>${server._count.templates}</td>
        <td><span class="badge ${server.online ? 'online' : 'offline'}">${server.online ? 'Online' : 'Offline'}</span></td>
      </tr>
    `).join('');

    // Populate server selectors
    const serverOptions = servers.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');
    document.getElementById('eventServer').innerHTML += serverOptions;
    document.getElementById('templateServer').innerHTML += serverOptions;
  } catch (error) {
    console.error('Failed to load servers:', error);
  }
}

// Events
let currentEventsPage = 0;
const EVENTS_PER_PAGE = 50;

async function searchEvents() {
  const query = document.getElementById('eventSearch').value;
  const status = document.getElementById('eventStatus').value;
  const serverId = document.getElementById('eventServer').value;

  try {
    const params = new URLSearchParams({
      limit: EVENTS_PER_PAGE,
      offset: currentEventsPage * EVENTS_PER_PAGE
    });

    if (query) params.append('q', query);
    if (status) params.append('status', status);
    if (serverId) params.append('guildId', serverId);

    const data = await API.get(`/api/admin/events/search?${params}`);
    const tbody = document.getElementById('eventsTable');

    if (data.events.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty">No events found</td></tr>';
      updatePagination('events', 0);
      return;
    }

    tbody.innerHTML = data.events.map(event => `
      <tr>
        <td><input type="checkbox" class="event-checkbox" value="${event.id}"></td>
        <td><strong>${escapeHtml(event.title)}</strong></td>
        <td>${escapeHtml(event.guild.name)}</td>
        <td>${new Date(event.dateTime).toLocaleString()}</td>
        <td>${event._count.participants}</td>
        <td><span class="badge ${event.status}">${event.status}</span></td>
      </tr>
    `).join('');

    updatePagination('events', data.total);
  } catch (error) {
    console.error('Failed to search events:', error);
  }
}

async function bulkDeleteEvents() {
  const checkboxes = document.querySelectorAll('.event-checkbox:checked');
  const eventIds = Array.from(checkboxes).map(cb => cb.value);

  if (eventIds.length === 0) {
    alert('No events selected');
    return;
  }

  if (!confirm(`Delete ${eventIds.length} events? This cannot be undone.`)) {
    return;
  }

  try {
    const result = await API.delete('/api/admin/events/bulk-delete', { eventIds });
    alert(`Deleted ${result.deleted} events`);
    searchEvents();
    loadStats();
  } catch (error) {
    alert('Failed to delete events');
    console.error(error);
  }
}

// Templates
let currentTemplatesPage = 0;
const TEMPLATES_PER_PAGE = 50;

async function searchTemplates() {
  const query = document.getElementById('templateSearch').value;
  const serverId = document.getElementById('templateServer').value;

  try {
    const params = new URLSearchParams({
      limit: TEMPLATES_PER_PAGE,
      offset: currentTemplatesPage * TEMPLATES_PER_PAGE
    });

    if (query) params.append('q', query);
    if (serverId) params.append('guildId', serverId);

    const data = await API.get(`/api/admin/templates/search?${params}`);
    const tbody = document.getElementById('templatesTable');

    if (data.templates.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty">No templates found</td></tr>';
      updatePagination('templates', 0);
      return;
    }

    tbody.innerHTML = data.templates.map(template => `
      <tr>
        <td><input type="checkbox" class="template-checkbox" value="${template.id}"></td>
        <td><strong>${escapeHtml(template.name)}</strong></td>
        <td>${escapeHtml(template.guild.name)}</td>
        <td>${template.config.roles ? template.config.roles.join(', ') : '-'}</td>
        <td>${new Date(template.createdAt).toLocaleDateString()}</td>
      </tr>
    `).join('');

    updatePagination('templates', data.total);
  } catch (error) {
    console.error('Failed to search templates:', error);
  }
}

async function bulkDeleteTemplates() {
  const checkboxes = document.querySelectorAll('.template-checkbox:checked');
  const templateIds = Array.from(checkboxes).map(cb => cb.value);

  if (templateIds.length === 0) {
    alert('No templates selected');
    return;
  }

  if (!confirm(`Delete ${templateIds.length} templates? This cannot be undone.`)) {
    return;
  }

  try {
    const result = await API.delete('/api/admin/templates/bulk-delete', { templateIds });
    alert(`Deleted ${result.deleted} templates`);
    searchTemplates();
    loadStats();
  } catch (error) {
    alert('Failed to delete templates');
    console.error(error);
  }
}

// Bot control
async function restartBot() {
  if (!confirm('Restart the bot? This will cause a brief downtime.')) {
    return;
  }

  try {
    await API.post('/api/admin/bot/restart', {});
    alert('Bot restart initiated. It should come back online in a few seconds.');
  } catch (error) {
    alert('Bot restart initiated. It should come back online in a few seconds.');
  }
}

// Utility
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
