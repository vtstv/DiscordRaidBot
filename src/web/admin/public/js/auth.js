// Authentication module
let currentUser = null;
let isAuthenticated = false;

async function checkAuth() {
  try {
    const response = await fetch('/auth/me', { credentials: 'include' });
    if (response.ok) {
      const user = await response.json();
      currentUser = user;
      isAuthenticated = true;
      
      // Check if admin
      const adminStatus = await fetch('/api/admin/status', { credentials: 'include' });
      if (adminStatus.ok) {
        const data = await adminStatus.json();
        if (data.isAdmin) {
          showApp();
          return true;
        }
      }
    }
  } catch (error) {
    console.error('Auth check failed:', error);
  }
  
  // Not authenticated or not admin
  showLoginModal();
  return false;
}

function showApp() {
  document.getElementById('loginModal').classList.remove('active');
  document.getElementById('app').style.display = 'block';
  document.getElementById('userInfo').style.display = 'flex';
  document.getElementById('userName').textContent = currentUser?.username || 'Admin';
  
  if (currentUser?.avatar) {
    const avatarUrl = `https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png?size=128`;
    document.getElementById('userAvatar').src = avatarUrl;
  }
}

function showLoginModal() {
  document.getElementById('loginModal').classList.add('active');
}

function loginWithDiscord() {
  // Redirect to OAuth with returnTo parameter for admin panel
  window.location.href = '/auth/login?returnTo=/a';
}

async function loginWithPassword(event) {
  event.preventDefault();
  
  const username = document.getElementById('adminUsername').value;
  const password = document.getElementById('adminPassword').value;
  
  try {
    const response = await fetch('/api/admin/auth/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include', // Important: send and receive cookies
    });
    
    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
      isAuthenticated = true;
      showApp();
    } else {
      alert('Invalid credentials');
    }
  } catch (error) {
    console.error('Login failed:', error);
    alert('Login failed');
  }
}

function logout() {
  fetch('/auth/logout', { method: 'POST', credentials: 'include' })
    .then(() => {
      window.location.reload();
    })
    .catch(() => {
      window.location.reload();
    });
}
