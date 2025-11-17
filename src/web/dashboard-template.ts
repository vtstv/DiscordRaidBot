// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: src/web/dashboard-template.ts
// Dashboard HTML template

export const dashboardHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Discord Raid Bot - Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        header {
            background: white;
            border-radius: 10px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        h1 {
            color: #5865F2;
            margin-bottom: 10px;
        }

        .subtitle {
            color: #666;
        }

        .guild-selector {
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        label {
            display: block;
            margin-bottom: 10px;
            font-weight: 600;
            color: #333;
        }

        input {
            width: 100%;
            padding: 10px;
            border: 2px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
            transition: border-color 0.3s;
        }

        input:focus {
            outline: none;
            border-color: #5865F2;
        }

        .tabs {
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .tab-buttons {
            display: flex;
            background: #f5f5f5;
            border-bottom: 2px solid #ddd;
        }

        .tab-button {
            flex: 1;
            padding: 15px;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            color: #666;
            transition: all 0.3s;
        }

        .tab-button.active {
            background: white;
            color: #5865F2;
            border-bottom: 3px solid #5865F2;
        }

        .tab-button:hover {
            background: #efefef;
        }

        .tab-content {
            display: none;
            padding: 30px;
        }

        .tab-content.active {
            display: block;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        thead {
            background: #5865F2;
            color: white;
        }

        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }

        tbody tr:hover {
            background: #f5f5f5;
        }

        .status-badge {
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: 600;
        }

        .status-upcoming {
            background: #fef3c7;
            color: #92400e;
        }

        .status-active {
            background: #d1fae5;
            color: #065f46;
        }

        .status-completed {
            background: #e0e7ff;
            color: #3730a3;
        }

        .event-details {
            background: #f9fafb;
            padding: 20px;
            margin-top: 10px;
            border-radius: 5px;
            border-left: 4px solid #5865F2;
        }

        .event-details h4 {
            color: #5865F2;
            margin-bottom: 10px;
        }

        .participant-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 10px;
            margin-top: 10px;
        }

        .participant-item {
            background: white;
            padding: 8px 12px;
            border-radius: 4px;
            border: 1px solid #ddd;
        }

        .participant-role {
            font-size: 12px;
            color: #666;
        }

        .clickable-row {
            cursor: pointer;
            transition: background-color 0.2s;
        }

        .clickable-row:hover {
            background-color: #f0f0f0 !important;
        }

        .expand-icon {
            transition: transform 0.3s;
            display: inline-block;
        }

        .expand-icon.expanded {
            transform: rotate(90deg);
        }

        .loading {
            text-align: center;
            padding: 40px;
            color: #666;
            font-size: 18px;
        }

        .error {
            background: #fee2e2;
            color: #991b1b;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 20px;
        }

        .help-section {
            margin-bottom: 30px;
        }

        .help-section h3 {
            color: #5865F2;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e0e7ff;
        }

        .help-section p, .help-section li {
            line-height: 1.8;
            color: #333;
            margin-bottom: 10px;
        }

        .help-section ul, .help-section ol {
            margin-left: 20px;
        }

        code {
            background: #f5f5f5;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            color: #e74c3c;
        }

        .refresh-info {
            text-align: center;
            color: #666;
            font-size: 14px;
            margin-top: 20px;
        }

        @media (max-width: 768px) {
            .tab-buttons {
                flex-direction: column;
            }

            table {
                font-size: 14px;
            }

            th, td {
                padding: 8px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🎮 Discord Raid Bot Dashboard</h1>
            <p class="subtitle">Manage your events and templates</p>
        </header>

        <div class="guild-selector">
            <label for="guildId">Guild ID:</label>
            <input type="text" id="guildId" placeholder="Enter your Discord Server (Guild) ID" />
        </div>

        <div class="tabs">
            <div class="tab-buttons">
                <button class="tab-button active" data-tab="events">Events</button>
                <button class="tab-button" data-tab="templates">Templates</button>
                <button class="tab-button" data-tab="help">Help</button>
            </div>

            <div id="events" class="tab-content active">
                <h2>📅 Events</h2>
                <div id="eventsData" class="loading">Enter a Guild ID above to load events...</div>
            </div>

            <div id="templates" class="tab-content">
                <h2>📋 Templates</h2>
                <div id="templatesData" class="loading">Enter a Guild ID above to load templates...</div>
            </div>

            <div id="help" class="tab-content">
                <div class="help-section">
                    <h3>Getting Started</h3>
                    <p>Welcome to the Discord Raid Bot Dashboard! This bot helps you organize and manage events for your Discord server.</p>
                    
                    <h3>How to Find Your Guild ID</h3>
                    <ol>
                        <li>Open Discord and go to User Settings</li>
                        <li>Navigate to Advanced settings</li>
                        <li>Enable "Developer Mode"</li>
                        <li>Right-click on your server icon and select "Copy Server ID"</li>
                        <li>Paste the ID in the field above</li>
                    </ol>

                    <h3>Creating Your First Event</h3>
                    <p>Use the following Discord commands:</p>
                    <ul>
                        <li><code>/event create</code> - Create a new event</li>
                        <li><code>/event list</code> - View all events</li>
                        <li><code>/event edit</code> - Modify an existing event</li>
                        <li><code>/event delete</code> - Remove an event</li>
                    </ul>

                    <h3>Working with Templates</h3>
                    <p>Templates help you quickly create similar events:</p>
                    <ul>
                        <li><code>/template create</code> - Create a new template</li>
                        <li><code>/template list</code> - View all templates</li>
                        <li><code>/template edit</code> - Modify a template</li>
                        <li><code>/template delete</code> - Remove a template</li>
                    </ul>

                    <h3>Event Features</h3>
                    <ul>
                        <li><strong>Participation Limits:</strong> Set maximum participants per event or per role</li>
                        <li><strong>Role/Spec Selection:</strong> Members can select their class, role, or specialization</li>
                        <li><strong>Waitlist:</strong> Automatic waitlist when event is full</li>
                        <li><strong>Reminders:</strong> Automatic reminders before event start</li>
                        <li><strong>Time Zones:</strong> All times are adjusted to your server's configured time zone</li>
                    </ul>

                    <h3>Member Signup Flow</h3>
                    <p>When you post an event, members can interact using buttons:</p>
                    <ol>
                        <li>Click "Join" to participate</li>
                        <li>Select their role/class from dropdown menu</li>
                        <li>Click "Leave" to opt out</li>
                        <li>View current participant list in the embed</li>
                    </ol>
                </div>
            </div>
        </div>

        <div class="refresh-info">
            Data refreshes automatically every 30 seconds
        </div>
    </div>

    <script>
        const API_BASE = '/api';
        let currentGuildId = localStorage.getItem('guildId') || '';
        let refreshInterval;

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            const guildInput = document.getElementById('guildId');
            if (currentGuildId) {
                guildInput.value = currentGuildId;
                loadData();
            }

            // Tab switching
            document.querySelectorAll('.tab-button').forEach(button => {
                button.addEventListener('click', () => {
                    const tabName = button.getAttribute('data-tab');
                    switchTab(tabName);
                });
            });

            // Guild ID change
            guildInput.addEventListener('input', (e) => {
                currentGuildId = e.target.value.trim();
                localStorage.setItem('guildId', currentGuildId);
                if (currentGuildId) {
                    loadData();
                }
            });

            // Auto-refresh
            refreshInterval = setInterval(() => {
                if (currentGuildId) {
                    loadData();
                }
            }, 30000); // Every 30 seconds
        });

        function switchTab(tabName) {
            // Update buttons
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(\`[data-tab="\${tabName}"]\`).classList.add('active');

            // Update content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(tabName).classList.add('active');
        }

        async function loadData() {
            if (!currentGuildId) return;

            await Promise.all([
                loadEvents(),
                loadTemplates()
            ]);
        }

        async function loadEvents() {
            const container = document.getElementById('eventsData');
            container.innerHTML = '<div class="loading">Loading events...</div>';

            try {
                const response = await fetch(\`\${API_BASE}/events?guildId=\${currentGuildId}\`);
                if (!response.ok) throw new Error('Failed to fetch events');

                const events = await response.json();

                if (events.length === 0) {
                    container.innerHTML = '<p>No events found. Create one using <code>/event create</code> in Discord!</p>';
                    return;
                }

                // Fetch full details for each event
                const eventsWithDetails = await Promise.all(
                    events.map(async (event) => {
                        try {
                            const detailResponse = await fetch(\`\${API_BASE}/events/\${event.id}\`);
                            if (detailResponse.ok) {
                                return await detailResponse.json();
                            }
                        } catch (e) {
                            console.error('Failed to fetch event details:', e);
                        }
                        return event;
                    })
                );

                let html = '<table><thead><tr><th style="width: 40px;"></th><th>Title</th><th>Date & Time</th><th>Participants</th><th>Status</th></tr></thead><tbody>';

                eventsWithDetails.forEach((event, index) => {
                    const startTime = new Date(event.startTime);
                    const now = new Date();
                    const status = event.status || (startTime > now ? 'scheduled' : 'completed');
                    const participants = event.participants || [];
                    const limit = event.participantLimit || '∞';

                    html += \`
                        <tr class="clickable-row" onclick="toggleEventDetails(\${index})">
                            <td><span class="expand-icon" id="icon-\${index}">▶</span></td>
                            <td><strong>\${escapeHtml(event.title)}</strong></td>
                            <td>\${formatDateTime(startTime)}</td>
                            <td>\${participants.length} / \${limit}</td>
                            <td><span class="status-badge status-\${status}">\${status.toUpperCase()}</span></td>
                        </tr>
                        <tr id="details-\${index}" style="display: none;">
                            <td colspan="5">
                                <div class="event-details">
                                    <h4>📋 Description</h4>
                                    <p>\${escapeHtml(event.description || 'No description provided')}</p>
                                    
                                    \${event.duration ? \`<p><strong>⏱️ Duration:</strong> \${event.duration} minutes</p>\` : ''}
                                    
                                    <h4>👥 Participants (\${participants.length})</h4>
                                    \${participants.length > 0 ? \`
                                        <div class="participant-list">
                                            \${participants.map(p => \`
                                                <div class="participant-item">
                                                    <div><strong>\${escapeHtml(p.username)}</strong></div>
                                                    \${p.role ? \`<div class="participant-role">\${escapeHtml(p.role)}\${p.spec ? ' - ' + escapeHtml(p.spec) : ''}</div>\` : ''}
                                                    <div class="participant-role">Status: \${p.status}</div>
                                                </div>
                                            \`).join('')}
                                        </div>
                                    \` : '<p><em>No participants yet</em></p>'}
                                    
                                    \${event.roleConfig && event.roleConfig.roles ? \`
                                        <h4>🎭 Available Roles</h4>
                                        <p>\${event.roleConfig.roles.map(role => {
                                            const emoji = event.roleConfig.emojiMap?.[role] || '';
                                            const limit = event.roleConfig.limits?.[role] || 'Unlimited';
                                            const count = participants.filter(p => p.role === role).length;
                                            return \`\${emoji} \${role} (\${count}/\${limit})\`;
                                        }).join(', ')}</p>
                                    \` : ''}
                                    
                                    <p style="margin-top: 15px;"><strong>Created by:</strong> \${escapeHtml(event.createdBy || 'Unknown')}</p>
                                </div>
                            </td>
                        </tr>
                    \`;
                });

                html += '</tbody></table>';
                container.innerHTML = html;

                // Store events data for toggle function
                window.eventsData = eventsWithDetails;
            } catch (error) {
                container.innerHTML = \`<div class="error">Error loading events: \${error.message}</div>\`;
            }
        }

        function toggleEventDetails(index) {
            const detailsRow = document.getElementById(\`details-\${index}\`);
            const icon = document.getElementById(\`icon-\${index}\`);
            
            if (detailsRow.style.display === 'none') {
                detailsRow.style.display = 'table-row';
                icon.classList.add('expanded');
            } else {
                detailsRow.style.display = 'none';
                icon.classList.remove('expanded');
            }
        }

        async function loadTemplates() {
            const container = document.getElementById('templatesData');
            container.innerHTML = '<div class="loading">Loading templates...</div>';

            try {
                const response = await fetch(\`\${API_BASE}/templates?guildId=\${currentGuildId}\`);
                if (!response.ok) throw new Error('Failed to fetch templates');

                const templates = await response.json();

                if (templates.length === 0) {
                    container.innerHTML = '<p>No templates found. Create one using <code>/template create</code> in Discord!</p>';
                    return;
                }

                const table = \`
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Participant Limit</th>
                                <th>Roles</th>
                            </tr>
                        </thead>
                        <tbody>
                            \${templates.map(template => {
                                const limit = template.participantLimit || 'No limit';
                                const roles = template.allowedRoles?.length || 0;

                                return \`
                                    <tr>
                                        <td><strong>\${escapeHtml(template.name)}</strong></td>
                                        <td>\${escapeHtml(template.description || 'N/A')}</td>
                                        <td>\${limit}</td>
                                        <td>\${roles} role(s)</td>
                                    </tr>
                                \`;
                            }).join('')}
                        </tbody>
                    </table>
                \`;

                container.innerHTML = table;
            } catch (error) {
                container.innerHTML = \`<div class="error">Error loading templates: \${error.message}</div>\`;
            }
        }

        function formatDateTime(date) {
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    </script>
</body>
</html>`;
