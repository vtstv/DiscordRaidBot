// Main application entry point
document.addEventListener('DOMContentLoaded', async () => {
  // Load config first
  await loadConfig();
  
  // Check authentication
  const isAuth = await checkAuth();
  
  if (isAuth) {
    // Load initial data
    await loadStats();
    await loadServers();
    await searchEvents();
    await searchTemplates();
  }
});

// Auto-refresh stats every 30 seconds
setInterval(() => {
  if (isAuthenticated) {
    loadStats();
  }
}, 30000);
