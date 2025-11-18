// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/admin-template.ts
// Admin panel HTML template

export function generateAdminHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Panel - RaidBot</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      --primary: #5865f2;
      --success: #57f287;
      --warning: #fee75c;
      --danger: #ed4245;
      --bg-dark: #1e1f22;
      --bg-card: #2b2d31;
      --bg-hover: #383a40;
      --text-primary: #f2f3f5;
      --text-secondary: #b5bac1;
      --border: #3f4147;
    }

    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: var(--bg-dark);
      color: var(--text-primary);
      line-height: 1.6;
    }

    header {
      background: var(--bg-card);
      border-bottom: 2px solid var(--border);
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    header h1 {
      font-size: 1.5rem;
      color: var(--primary);
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }

    .container {
      max-width: 1400px;
      margin: 2rem auto;
      padding: 0 2rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: var(--bg-card);
      padding: 1.5rem;
      border-radius: 8px;
      border: 1px solid var(--border);
    }

    .stat-card h3 {
      font-size: 0.875rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      margin-bottom: 0.5rem;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: bold;
      color: var(--primary);
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-top: 0.25rem;
    }

    .tabs {
      display: flex;
      gap: 1rem;
      border-bottom: 2px solid var(--border);
      margin-bottom: 2rem;
    }

    .tab {
      padding: 0.75rem 1.5rem;
      background: none;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 1rem;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      transition: all 0.2s;
    }

    .tab:hover {
      color: var(--text-primary);
    }

    .tab.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
    }

    .search-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .search-bar input,
    .search-bar select {
      flex: 1;
      min-width: 200px;
      padding: 0.75rem;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 4px;
      color: var(--text-primary);
      font-size: 0.875rem;
    }

    .search-bar button {
      padding: 0.75rem 1.5rem;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      transition: opacity 0.2s;
    }

    .search-bar button:hover {
      opacity: 0.9;
    }

    .data-table {
      background: var(--bg-card);
      border-radius: 8px;
      border: 1px solid var(--border);
      overflow: hidden;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th {
      background: var(--bg-hover);
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
    }

    td {
      padding: 1rem;
      border-bottom: 1px solid var(--border);
    }

    tr:hover {
      background: var(--bg-hover);
    }

    .checkbox {
      width: 20px;
      height: 20px;
      cursor: pointer;
    }

    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: bold;
      display: inline-block;
    }

    .badge.active {
      background: var(--success);
      color: #000;
    }

    .badge.scheduled {
      background: var(--warning);
      color: #000;
    }

    .badge.completed {
      background: var(--text-secondary);
      color: #000;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: bold;
      transition: opacity 0.2s;
    }

    .btn:hover {
      opacity: 0.9;
    }

    .btn-danger {
      background: var(--danger);
      color: white;
    }

    .btn-primary {
      background: var(--primary);
      color: white;
    }

    .bulk-actions {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      padding: 1rem;
      background: var(--bg-card);
      border-radius: 4px;
      border: 1px solid var(--border);
    }

    .loading {
      text-align: center;
      padding: 2rem;
      color: var(--text-secondary);
    }

    .empty {
      text-align: center;
      padding: 3rem;
      color: var(--text-secondary);
    }

    .pagination {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 1.5rem;
    }

    .pagination button {
      padding: 0.5rem 1rem;
      background: var(--bg-card);
      border: 1px solid var(--border);
      color: var(--text-primary);
      border-radius: 4px;
      cursor: pointer;
    }

    .pagination button:hover:not(:disabled) {
      background: var(--bg-hover);
    }

    .pagination button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .log-entry {
      margin-bottom: 0.5rem;
      padding: 0.75rem;
      background: var(--bg-dark);
      border-left: 3px solid var(--primary);
      border-radius: 4px;
    }

    .log-time {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    footer {
      text-align: center;
      padding: 2rem;
      color: var(--text-secondary);
      border-top: 1px solid var(--border);
      margin-top: 4rem;
    }
  </style>
</head>
<body>
  <header>
    <h1>🛡️ RaidBot Admin Panel</h1>
    <div class="user-info">
      <span id="userName">Loading...</span>
      <img id="userAvatar" class="user-avatar" src="" alt="Avatar">
    </div>
  </header>

  <div class="container">
    <!-- Stats Dashboard -->
    <div id="statsSection">
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Total Guilds</h3>
          <div class="stat-value" id="statGuilds">-</div>
          <div class="stat-label">Active servers</div>
        </div>
        <div class="stat-card">
          <h3>Total Events</h3>
          <div class="stat-value" id="statEvents">-</div>
          <div class="stat-label">All time</div>
        </div>
        <div class="stat-card">
          <h3>Active Events</h3>
          <div class="stat-value" id="statActiveEvents">-</div>
          <div class="stat-label">Currently running</div>
        </div>
        <div class="stat-card">
          <h3>Templates</h3>
          <div class="stat-value" id="statTemplates">-</div>
          <div class="stat-label">Created</div>
        </div>
        <div class="stat-card">
          <h3>Participants</h3>
          <div class="stat-value" id="statParticipants">-</div>
          <div class="stat-label">Total signups</div>
        </div>
        <div class="stat-card">
          <h3>Bot Uptime</h3>
          <div class="stat-value" id="statUptime">-</div>
          <div class="stat-label">Days</div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button class="tab active" data-tab="guilds">Guilds</button>
      <button class="tab" data-tab="events">Events</button>
      <button class="tab" data-tab="templates">Templates</button>
      <button class="tab" data-tab="logs">Activity Logs</button>
      <button class="tab" data-tab="system">System</button>
    </div>

    <!-- Guilds Tab -->
    <div id="guilds" class="tab-content active">
      <div class="data-table">
        <table>
          <thead>
            <tr>
              <th>Guild Name</th>
              <th>Members</th>
              <th>Events</th>
              <th>Templates</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="guildsTable">
            <tr><td colspan="5" class="loading">Loading guilds...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Events Tab -->
    <div id="events" class="tab-content">
      <div class="search-bar">
        <input type="text" id="eventSearch" placeholder="Search events...">
        <select id="eventStatus">
          <option value="">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select id="eventGuild">
          <option value="">All Guilds</option>
        </select>
        <button onclick="searchEvents()">Search</button>
      </div>

      <div class="bulk-actions">
        <button class="btn btn-danger" onclick="bulkDeleteEvents()">Delete Selected</button>
        <span id="selectedEventsCount">0 selected</span>
      </div>

      <div class="data-table">
        <table>
          <thead>
            <tr>
              <th><input type="checkbox" class="checkbox" id="selectAllEvents" onchange="toggleSelectAll('events')"></th>
              <th>Title</th>
              <th>Guild</th>
              <th>Date</th>
              <th>Participants</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="eventsTable">
            <tr><td colspan="6" class="loading">Loading events...</td></tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" id="eventsPagination"></div>
    </div>

    <!-- Templates Tab -->
    <div id="templates" class="tab-content">
      <div class="search-bar">
        <input type="text" id="templateSearch" placeholder="Search templates...">
        <select id="templateGuild">
          <option value="">All Guilds</option>
        </select>
        <button onclick="searchTemplates()">Search</button>
      </div>

      <div class="bulk-actions">
        <button class="btn btn-danger" onclick="bulkDeleteTemplates()">Delete Selected</button>
        <span id="selectedTemplatesCount">0 selected</span>
      </div>

      <div class="data-table">
        <table>
          <thead>
            <tr>
              <th><input type="checkbox" class="checkbox" id="selectAllTemplates" onchange="toggleSelectAll('templates')"></th>
              <th>Name</th>
              <th>Guild</th>
              <th>Roles</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody id="templatesTable">
            <tr><td colspan="5" class="loading">Loading templates...</td></tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" id="templatesPagination"></div>
    </div>

    <!-- Logs Tab -->
    <div id="logs" class="tab-content">
      <div class="search-bar">
        <select id="logGuild">
          <option value="">All Guilds</option>
        </select>
        <button onclick="loadLogs()">Refresh</button>
      </div>

      <div id="logsContainer">
        <div class="loading">Loading logs...</div>
      </div>

      <div class="pagination" id="logsPagination"></div>
    </div>

    <!-- System Tab -->
    <div id="system" class="tab-content">
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Bot Guilds</h3>
          <div class="stat-value" id="sysBotGuilds">-</div>
          <div class="stat-label">Connected servers</div>
        </div>
        <div class="stat-card">
          <h3>Total Users</h3>
          <div class="stat-value" id="sysBotUsers">-</div>
          <div class="stat-label">Across all guilds</div>
        </div>
        <div class="stat-card">
          <h3>WebSocket Ping</h3>
          <div class="stat-value" id="sysBotPing">-</div>
          <div class="stat-label">Milliseconds</div>
        </div>
      </div>

      <div style="margin-top: 2rem;">
        <button class="btn btn-danger" onclick="restartBot()">🔄 Restart Bot</button>
        <p style="margin-top: 0.5rem; color: var(--text-secondary);">
          Warning: This will restart the bot process. Docker should automatically restart it.
        </p>
      </div>
    </div>
  </div>

  <footer>
    <p>&copy; 2025 Murr. Licensed under MIT License. v1.0.0</p>
  </footer>

  <script>
    let currentEventsPage = 0;
    let currentTemplatesPage = 0;
    let currentLogsPage = 0;
    const ITEMS_PER_PAGE = 50;

    // Initialize
    async function init() {
      // Check admin status
      const status = await fetch('/api/admin/status').then(r => r.json());
      
      if (!status.authenticated) {
        window.location.href = '/auth/login';
        return;
      }

      if (!status.isAdmin) {
        document.body.innerHTML = '<div style="text-align:center;padding:4rem;"><h1>403 Forbidden</h1><p>Admin access required</p></div>';
        return;
      }

      document.getElementById('userName').textContent = status.user.username;
      if (status.user.avatar) {
        document.getElementById('userAvatar').src = \`https://cdn.discordapp.com/avatars/\${status.user.id}/\${status.user.avatar}.png?size=128\`;
      }

      // Load initial data
      await Promise.all([
        loadStats(),
        loadGuilds(),
        searchEvents(),
        searchTemplates(),
        loadLogs()
      ]);

      // Setup tabs
      document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
      });
    }

    function switchTab(tabName) {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      document.querySelector(\`[data-tab="\${tabName}"]\`).classList.add('active');
      document.getElementById(tabName).classList.add('active');
    }

    async function loadStats() {
      try {
        const data = await fetch('/api/admin/stats').then(r => r.json());
        
        document.getElementById('statGuilds').textContent = data.database.totalGuilds;
        document.getElementById('statEvents').textContent = data.database.totalEvents;
        document.getElementById('statActiveEvents').textContent = data.database.activeEvents;
        document.getElementById('statTemplates').textContent = data.database.totalTemplates;
        document.getElementById('statParticipants').textContent = data.database.totalParticipants;
        
        if (data.bot) {
          const days = Math.floor(data.bot.uptime / 86400);
          document.getElementById('statUptime').textContent = days;
          document.getElementById('sysBotGuilds').textContent = data.bot.guilds;
          document.getElementById('sysBotUsers').textContent = data.bot.users.toLocaleString();
          document.getElementById('sysBotPing').textContent = data.bot.ping;
        }
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    }

    async function loadGuilds() {
      try {
        const guilds = await fetch('/api/admin/guilds').then(r => r.json());
        const tbody = document.getElementById('guildsTable');
        
        if (guilds.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" class="empty">No guilds found</td></tr>';
          return;
        }

        tbody.innerHTML = guilds.map(guild => \`
          <tr>
            <td><strong>\${escapeHtml(guild.name)}</strong></td>
            <td>\${guild.memberCount.toLocaleString()}</td>
            <td>\${guild._count.events}</td>
            <td>\${guild._count.templates}</td>
            <td><span class="badge \${guild.online ? 'active' : 'completed'}">\${guild.online ? 'Online' : 'Offline'}</span></td>
          </tr>
        \`).join('');

        // Populate guild selectors
        const guildOptions = guilds.map(g => \`<option value="\${g.id}">\${escapeHtml(g.name)}</option>\`).join('');
        document.getElementById('eventGuild').innerHTML += guildOptions;
        document.getElementById('templateGuild').innerHTML += guildOptions;
        document.getElementById('logGuild').innerHTML += guildOptions;
      } catch (error) {
        console.error('Failed to load guilds:', error);
      }
    }

    async function searchEvents() {
      const query = document.getElementById('eventSearch').value;
      const status = document.getElementById('eventStatus').value;
      const guildId = document.getElementById('eventGuild').value;

      try {
        const params = new URLSearchParams({
          limit: ITEMS_PER_PAGE,
          offset: currentEventsPage * ITEMS_PER_PAGE
        });

        if (query) params.append('q', query);
        if (status) params.append('status', status);
        if (guildId) params.append('guildId', guildId);

        const data = await fetch(\`/api/admin/events/search?\${params}\`).then(r => r.json());
        const tbody = document.getElementById('eventsTable');

        if (data.events.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="empty">No events found</td></tr>';
          return;
        }

        tbody.innerHTML = data.events.map(event => \`
          <tr>
            <td><input type="checkbox" class="checkbox event-checkbox" value="\${event.id}"></td>
            <td><strong>\${escapeHtml(event.title)}</strong></td>
            <td>\${escapeHtml(event.guild.name)}</td>
            <td>\${new Date(event.dateTime).toLocaleString()}</td>
            <td>\${event._count.participants}</td>
            <td><span class="badge \${event.status}">\${event.status}</span></td>
          </tr>
        \`).join('');

        updatePagination('events', data.total);
      } catch (error) {
        console.error('Failed to search events:', error);
      }
    }

    async function searchTemplates() {
      const query = document.getElementById('templateSearch').value;
      const guildId = document.getElementById('templateGuild').value;

      try {
        const params = new URLSearchParams({
          limit: ITEMS_PER_PAGE,
          offset: currentTemplatesPage * ITEMS_PER_PAGE
        });

        if (query) params.append('q', query);
        if (guildId) params.append('guildId', guildId);

        const data = await fetch(\`/api/admin/templates/search?\${params}\`).then(r => r.json());
        const tbody = document.getElementById('templatesTable');

        if (data.templates.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" class="empty">No templates found</td></tr>';
          return;
        }

        tbody.innerHTML = data.templates.map(template => \`
          <tr>
            <td><input type="checkbox" class="checkbox template-checkbox" value="\${template.id}"></td>
            <td><strong>\${escapeHtml(template.name)}</strong></td>
            <td>\${escapeHtml(template.guild.name)}</td>
            <td>\${template.config.roles ? template.config.roles.join(', ') : '-'}</td>
            <td>\${new Date(template.createdAt).toLocaleDateString()}</td>
          </tr>
        \`).join('');

        updatePagination('templates', data.total);
      } catch (error) {
        console.error('Failed to search templates:', error);
      }
    }

    async function loadLogs() {
      const guildId = document.getElementById('logGuild').value;

      try {
        const params = new URLSearchParams({
          limit: 100,
          offset: currentLogsPage * 100
        });

        if (guildId) params.append('guildId', guildId);

        const data = await fetch(\`/api/admin/logs?\${params}\`).then(r => r.json());
        const container = document.getElementById('logsContainer');

        if (data.logs.length === 0) {
          container.innerHTML = '<div class="empty">No logs found</div>';
          return;
        }

        container.innerHTML = data.logs.map(log => \`
          <div class="log-entry">
            <div class="log-time">\${new Date(log.createdAt).toLocaleString()} - \${escapeHtml(log.guild.name)}</div>
            <strong>\${log.action}</strong> by \${log.userId}
            <div style="color: var(--text-secondary); font-size: 0.875rem;">\${JSON.stringify(log.metadata)}</div>
          </div>
        \`).join('');

        updatePagination('logs', data.total);
      } catch (error) {
        console.error('Failed to load logs:', error);
      }
    }

    function updatePagination(type, total) {
      let currentPage, setPage, paginationId;

      if (type === 'events') {
        currentPage = currentEventsPage;
        setPage = (p) => { currentEventsPage = p; searchEvents(); };
        paginationId = 'eventsPagination';
      } else if (type === 'templates') {
        currentPage = currentTemplatesPage;
        setPage = (p) => { currentTemplatesPage = p; searchTemplates(); };
        paginationId = 'templatesPagination';
      } else {
        currentPage = currentLogsPage;
        setPage = (p) => { currentLogsPage = p; loadLogs(); };
        paginationId = 'logsPagination';
      }

      const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
      const container = document.getElementById(paginationId);

      container.innerHTML = \`
        <button \${currentPage === 0 ? 'disabled' : ''} onclick="changePage('\${type}', 0)">First</button>
        <button \${currentPage === 0 ? 'disabled' : ''} onclick="changePage('\${type}', \${currentPage - 1})">Previous</button>
        <span>Page \${currentPage + 1} of \${totalPages}</span>
        <button \${currentPage >= totalPages - 1 ? 'disabled' : ''} onclick="changePage('\${type}', \${currentPage + 1})">Next</button>
        <button \${currentPage >= totalPages - 1 ? 'disabled' : ''} onclick="changePage('\${type}', \${totalPages - 1})">Last</button>
      \`;
    }

    function changePage(type, page) {
      if (type === 'events') {
        currentEventsPage = page;
        searchEvents();
      } else if (type === 'templates') {
        currentTemplatesPage = page;
        searchTemplates();
      } else {
        currentLogsPage = page;
        loadLogs();
      }
    }

    function toggleSelectAll(type) {
      const checkboxes = document.querySelectorAll(\`.\${type}-checkbox\`);
      const selectAll = document.getElementById(\`selectAll\${type.charAt(0).toUpperCase() + type.slice(1)}\`);
      
      checkboxes.forEach(cb => cb.checked = selectAll.checked);
      updateSelectedCount(type);
    }

    function updateSelectedCount(type) {
      const checkboxes = document.querySelectorAll(\`.\${type}-checkbox:checked\`);
      document.getElementById(\`selected\${type.charAt(0).toUpperCase() + type.slice(1)}Count\`).textContent = \`\${checkboxes.length} selected\`;
    }

    async function bulkDeleteEvents() {
      const checkboxes = document.querySelectorAll('.event-checkbox:checked');
      const eventIds = Array.from(checkboxes).map(cb => cb.value);

      if (eventIds.length === 0) {
        alert('No events selected');
        return;
      }

      if (!confirm(\`Delete \${eventIds.length} events? This cannot be undone.\`)) {
        return;
      }

      try {
        const result = await fetch('/api/admin/events/bulk-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventIds })
        }).then(r => r.json());

        alert(\`Deleted \${result.deleted} events\`);
        searchEvents();
        loadStats();
      } catch (error) {
        alert('Failed to delete events');
        console.error(error);
      }
    }

    async function bulkDeleteTemplates() {
      const checkboxes = document.querySelectorAll('.template-checkbox:checked');
      const templateIds = Array.from(checkboxes).map(cb => cb.value);

      if (templateIds.length === 0) {
        alert('No templates selected');
        return;
      }

      if (!confirm(\`Delete \${templateIds.length} templates? This cannot be undone.\`)) {
        return;
      }

      try {
        const result = await fetch('/api/admin/templates/bulk-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ templateIds })
        }).then(r => r.json());

        alert(\`Deleted \${result.deleted} templates\`);
        searchTemplates();
        loadStats();
      } catch (error) {
        alert('Failed to delete templates');
        console.error(error);
      }
    }

    async function restartBot() {
      if (!confirm('Restart the bot? This will cause a brief downtime.')) {
        return;
      }

      try {
        await fetch('/api/admin/bot/restart', { method: 'POST' });
        alert('Bot restart initiated. It should come back online in a few seconds.');
      } catch (error) {
        // Expected error since bot will disconnect
        alert('Bot restart initiated. It should come back online in a few seconds.');
      }
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // Event listeners for checkboxes
    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('event-checkbox')) {
        updateSelectedCount('events');
      } else if (e.target.classList.contains('template-checkbox')) {
        updateSelectedCount('templates');
      }
    });

    // Initialize on load
    init();
  </script>
</body>
</html>`;
}
