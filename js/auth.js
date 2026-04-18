/* ============================================================
   AGENTS MAÎTRES — Authentication (Simulated)
   Login, logout, session management
   ============================================================ */

const AUTH_STORAGE_KEY = 'agentsmaitres_user';

// Demo users for testing
const DEMO_USERS = [
  { email: 'demo@agentsmaitres.fr', password: 'demo2024', name: 'Jean Dupont' },
  { email: 'admin@agentsmaitres.fr', password: 'admin2024', name: 'Marie Laurent' }
];

// Get current user from session
function getCurrentUser() {
  try {
    const data = sessionStorage.getItem(AUTH_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// Check if user is authenticated
function isAuthenticated() {
  return getCurrentUser() !== null;
}

// Login with email and password
function login(email, password) {
  return new Promise((resolve, reject) => {
    // Simulate API call delay
    setTimeout(() => {
      if (!email || !password) {
        reject(new Error('Veuillez remplir tous les champs.'));
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        reject(new Error('Format d\'email invalide.'));
        return;
      }

      if (password.length < 6) {
        reject(new Error('Le mot de passe doit contenir au moins 6 caractères.'));
        return;
      }

      // Check demo users or accept any valid input in demo mode
      const demoUser = DEMO_USERS.find(u => u.email === email && u.password === password);
      
      const user = demoUser ? {
        email: demoUser.email,
        name: demoUser.name,
        initials: getInitials(demoUser.name),
        loginTime: new Date().toISOString()
      } : {
        email: email,
        name: extractNameFromEmail(email),
        initials: getInitials(extractNameFromEmail(email)),
        loginTime: new Date().toISOString()
      };

      // Store in session
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      resolve(user);
    }, 800); // Simulated delay
  });
}

// Logout
function logout() {
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
}

// Helper: extract name from email
function extractNameFromEmail(email) {
  const local = email.split('@')[0];
  return local
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Helper: get initials
function getInitials(name) {
  return name
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export { getCurrentUser, isAuthenticated, login, logout };
