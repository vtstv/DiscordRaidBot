// Configuration loaded from backend
window.AppConfig = {
  apiBaseUrl: '',  // Will be loaded from server
  oauthEnabled: true,
  passwordAuthEnabled: true
};

// Load config from server
async function loadConfig() {
  try {
    const response = await fetch('/api/admin/config');
    if (response.ok) {
      const config = await response.json();
      window.AppConfig = { ...window.AppConfig, ...config };
    }
  } catch (error) {
    console.error('Failed to load config:', error);
  }
}

// Initialize config on load
loadConfig();
