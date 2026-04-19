/* ============================================================
   AGENTS MAÎTRES — Main Application
   SPA Router, initialization, event management
   ============================================================ */

import { getAgentsList, getAgent } from './agents.js?v=3.2';
import { isAuthenticated, getCurrentUser, login, logout } from './auth.js?v=3.2';
import {
  getConversationsByAgent,
  getConversation,
  createConversation,
  deleteConversation,
  transferConversation,
  formatDate
} from './history.js?v=3.2';
import { sendMessage, renderMessages, initV3Features } from './chat.js?v=3.2';

// ============================================================
// APPLICATION STATE
// ============================================================
window.appState = {
  user: null,
  currentAgent: null,
  currentConversation: null,
  sidebarOpen: false,
  panelOpen: false
};

// ============================================================
// VIEW MANAGEMENT
// ============================================================
function showView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const view = document.getElementById(viewId);
  if (view) view.classList.add('active');
}

// ============================================================
// LOGIN VIEW
// ============================================================
function initLogin() {
  showView('login-view');

  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const errorEl = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-submit');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = emailInput.value.trim();
      const password = passwordInput.value;

      // Clear error
      errorEl.textContent = '';
      errorEl.style.display = 'none';

      // Disable button
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<div class="loader-spinner"></div> Connexion...';

      try {
        const user = await login(email, password);
        window.appState.user = user;
        initDashboard();
      } catch (error) {
        errorEl.textContent = error.message;
        errorEl.style.display = 'flex';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Se connecter';

        // Shake animation
        form.classList.add('shake');
        setTimeout(() => form.classList.remove('shake'), 500);
      }
    });
  }

  // Password visibility toggle
  const toggleBtn = document.getElementById('password-toggle');
  
  // Reset App Button
  const resetAppBtn = document.getElementById('reset-app-btn');
  if (resetAppBtn) {
    resetAppBtn.addEventListener('click', () => {
      if (confirm('Voulez-vous réinitialiser l\'application ? Cela effacera toutes les conversations et videra le cache local.')) {
        localStorage.clear();
        window.location.reload(true);
      }
    });
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const type = passwordInput.type === 'password' ? 'text' : 'password';
      passwordInput.type = type;
      toggleBtn.innerHTML = type === 'password'
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
    });
  }
}

// ============================================================
// DASHBOARD VIEW
// ============================================================
function initDashboard() {
  showView('dashboard-view');

  const user = window.appState.user || getCurrentUser();
  if (!user) {
    initLogin();
    return;
  }
  window.appState.user = user;

  // Update user info
  const userName = document.getElementById('dashboard-user-name');
  const userInitials = document.getElementById('dashboard-user-initials');
  if (userName) userName.textContent = user.name;
  if (userInitials) userInitials.textContent = user.initials;

  // Render agent cards
  const grid = document.getElementById('agents-grid');
  if (grid) {
    grid.innerHTML = '';
    const agents = getAgentsList();
    agents.forEach(agent => {
      const card = createAgentCard(agent);
      grid.appendChild(card);
    });
  }

  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      logout();
      window.appState.user = null;
      initLogin();
    };
  }
}

function createAgentCard(agent) {
  const card = document.createElement('div');
  card.className = 'card card-agent';
  card.style.setProperty('--agent-color', agent.color);
  card.dataset.agentId = agent.id;

  card.innerHTML = `
    <div class="agent-header">
      <img class="agent-avatar" src="${agent.avatar}" alt="${agent.name}" onerror="this.style.background='${agent.color}22'; this.style.display='flex'; this.alt='${agent.icon}'">
      <div class="agent-info">
        <div class="agent-name">${agent.name}</div>
        <div class="agent-title">${agent.title}</div>
      </div>
    </div>
    <div class="agent-description">${agent.description}</div>
    <div class="agent-specialties">
      ${agent.specialties.slice(0, 4).map(s => `<span class="chip">${s}</span>`).join('')}
    </div>
    <div class="agent-cta">
      Démarrer une consultation
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
    </div>
  `;

  card.addEventListener('click', () => {
    openAgent(agent.id);
  });

  return card;
}

// ============================================================
// CHAT VIEW
// ============================================================
function openAgent(agentId) {
  const agent = getAgent(agentId);
  if (!agent) return;

  window.appState.currentAgent = agent;

  showView('chat-view');

  // Set agent color as CSS variable on chat view
  const chatView = document.getElementById('chat-view');
  chatView.style.setProperty('--agent-color', agent.color);

  // Update chat header
  const headerAvatar = document.getElementById('chat-agent-avatar');
  const headerName = document.getElementById('chat-agent-name');
  const headerStatus = document.getElementById('chat-agent-status');

  if (headerAvatar) {
    headerAvatar.src = agent.avatar;
    headerAvatar.style.borderColor = agent.color;
  }
  if (headerName) headerName.textContent = `${agent.name} — ${agent.title}`;
  if (headerStatus) {
    headerStatus.textContent = 'Vérification...';
    headerStatus.classList.remove('status-live', 'status-simulation');
  }

  // Update info panel
  updateInfoPanel(agent);

  // Load or create conversation
  const conversations = getConversationsByAgent(agentId);
  let conversation;

  if (conversations.length > 0) {
    conversation = conversations[0]; // Most recent
  } else {
    conversation = createConversation(agentId);
  }

  window.appState.currentConversation = conversation;

  // Render sidebar
  updateSidebar();

  // Render messages
  renderMessages(conversation, agentId);

  // Setup input
  setupChatInput();

  // Initialize v3.0 features
  initV3Features();
}

function updateInfoPanel(agent) {
  // Panel avatar
  const panelAvatar = document.getElementById('panel-agent-avatar');
  const panelName = document.getElementById('panel-agent-name');
  const panelTitle = document.getElementById('panel-agent-title');

  if (panelAvatar) {
    panelAvatar.src = agent.avatar;
    panelAvatar.style.borderColor = agent.color;
  }
  if (panelName) panelName.textContent = agent.name;
  if (panelTitle) {
    panelTitle.textContent = agent.title;
    panelTitle.style.color = agent.color;
  }

  // Panel sources
  const sourcesList = document.getElementById('panel-sources-list');
  if (sourcesList) {
    sourcesList.innerHTML = agent.sources.map(s => `
      <a href="${s.url}" target="_blank" rel="noopener" class="panel-source-item">
        <span class="source-icon">📄</span>
        <span>${s.name}</span>
      </a>
    `).join('');
  }

  // Panel specialties
  const specList = document.getElementById('panel-specialties-list');
  if (specList) {
    specList.innerHTML = agent.specialties.map(s => `<span class="chip">${s}</span>`).join('');
  }
}

// Sidebar
window.updateSidebar = function() {
  const agent = window.appState.currentAgent;
  if (!agent) return;

  const container = document.getElementById('sidebar-conversations');
  if (!container) return;

  const conversations = getConversationsByAgent(agent.id);

  container.innerHTML = '';

  if (conversations.length === 0) {
    container.innerHTML = `<div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.8125rem;">Aucune conversation</div>`;
    return;
  }

  conversations.forEach(conv => {
    const isActive = window.appState.currentConversation?.id === conv.id;
    const item = document.createElement('div');
    item.className = `conversation-item${isActive ? ' active' : ''}`;
    item.dataset.convId = conv.id;
    item.innerHTML = `
      <div class="conv-dot" style="background: ${agent.color}"></div>
      <div class="conv-info">
        <div class="conv-title">${escapeHtml(conv.title)}</div>
        <div class="conv-date">${formatDate(conv.updatedAt)}</div>
      </div>
      <button class="conv-delete" data-delete-conv="${conv.id}" title="Supprimer">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;

    // Click to switch conversation
    item.addEventListener('click', (e) => {
      if (e.target.closest('.conv-delete')) return;
      const full = getConversation(conv.id);
      if (full) {
        window.appState.currentConversation = full;
        renderMessages(full, agent.id);
        updateSidebar();
      }
    });

    container.appendChild(item);
  });

  // Delete handlers
  container.querySelectorAll('.conv-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const convId = btn.dataset.deleteConv;
      deleteConversation(convId);

      // If deleting current conversation, create new one
      if (window.appState.currentConversation?.id === convId) {
        const newConv = createConversation(agent.id);
        window.appState.currentConversation = newConv;
        renderMessages(newConv, agent.id);
      }
      updateSidebar();
    });
  });
};

function setupChatInput() {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send-btn');

  if (!input || !sendBtn) return;

  // Remove old listeners by cloning
  const newInput = input.cloneNode(true);
  input.parentNode.replaceChild(newInput, input);
  const newSendBtn = sendBtn.cloneNode(true);
  sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);

  // Auto-resize textarea
  newInput.addEventListener('input', () => {
    newInput.style.height = 'auto';
    newInput.style.height = Math.min(newInput.scrollHeight, 120) + 'px';
    newSendBtn.disabled = !newInput.value.trim();
  });

  // Send on Enter (not Shift+Enter)
  newInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(newInput, newSendBtn);
    }
  });

  // Send button click
  newSendBtn.addEventListener('click', () => {
    handleSend(newInput, newSendBtn);
  });

  newInput.value = '';
  newInput.style.height = 'auto';
  newSendBtn.disabled = true;
  newInput.focus();
}

function handleSend(input, sendBtn) {
  const content = input.value.trim();
  if (!content) return;
  if (!window.appState.currentConversation || !window.appState.currentAgent) return;

  // Clear and hide welcome
  const welcome = document.querySelector('.chat-welcome');
  if (welcome) welcome.remove();

  const convId = window.appState.currentConversation.id;
  const agentId = window.appState.currentAgent.id;

  input.value = '';
  input.style.height = 'auto';
  sendBtn.disabled = true;

  sendMessage(convId, agentId, content);
}

// ============================================================
// GLOBAL EVENT HANDLERS
// ============================================================
function initGlobalEvents() {
  // Event delegation for dynamic elements
  document.addEventListener('click', (e) => {
    // Suggestion chips
    const chip = e.target.closest('.suggestion-chip');
    if (chip) {
      const input = document.getElementById('chat-input');
      if (input) {
        input.value = chip.dataset.suggestion || chip.textContent;
        input.dispatchEvent(new Event('input'));
        // Auto send
        const sendBtn = document.getElementById('chat-send-btn');
        handleSend(input, sendBtn);
      }
      return;
    }

    // Transfer button
    const transferBtn = e.target.closest('.btn-transfer');
    if (transferBtn) {
      const targetAgentId = transferBtn.dataset.transferAgent;
      handleTransfer(targetAgentId);
      return;
    }

    // Sidebar overlay close
    const overlay = e.target.closest('.sidebar-overlay');
    if (overlay) {
      toggleSidebar(false);
      return;
    }
  });

  // Back to dashboard button
  const backBtn = document.getElementById('back-to-dashboard');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.appState.currentAgent = null;
      window.appState.currentConversation = null;
      initDashboard();
    });
  }

  // New conversation button
  const newConvBtn = document.getElementById('new-conversation-btn');
  if (newConvBtn) {
    newConvBtn.addEventListener('click', () => {
      if (!window.appState.currentAgent) return;
      const conv = createConversation(window.appState.currentAgent.id);
      window.appState.currentConversation = conv;
      renderMessages(conv, window.appState.currentAgent.id);
      updateSidebar();
    });
  }

  // Sidebar toggle
  const sidebarToggle = document.getElementById('sidebar-toggle-btn');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      toggleSidebar(!window.appState.sidebarOpen);
    });
  }

  // Panel toggle
  const panelToggle = document.getElementById('panel-toggle-btn');
  if (panelToggle) {
    panelToggle.addEventListener('click', () => {
      togglePanel(!window.appState.panelOpen);
    });
  }

  // Panel close
  const panelClose = document.getElementById('panel-close-btn');
  if (panelClose) {
    panelClose.addEventListener('click', () => {
      togglePanel(false);
    });
  }
}

function handleTransfer(targetAgentId) {
  if (!window.appState.currentConversation) return;

  const newConv = transferConversation(
    window.appState.currentConversation.id,
    targetAgentId
  );

  if (newConv) {
    showToast(`Conversation transférée à ${getAgent(targetAgentId).name}`, 'success');
    openAgent(targetAgentId);
    
    // Load the transferred conversation
    window.appState.currentConversation = newConv;
    renderMessages(newConv, targetAgentId);
    updateSidebar();
  }
}

function toggleSidebar(open) {
  window.appState.sidebarOpen = open;
  const sidebar = document.getElementById('chat-sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.toggle('sidebar-open', open);
  if (overlay) overlay.classList.toggle('active', open);
}

function togglePanel(open) {
  window.appState.panelOpen = open;
  const panel = document.getElementById('chat-panel');
  if (panel) panel.classList.toggle('panel-open', open);
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
window.showToast = function(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠'
  };

  toast.innerHTML = `
    <span>${icons[type] || '•'}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;

  container.appendChild(toast);

  // Auto remove after 4s
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

// ============================================================
// ESCAPE HTML UTILITY
// ============================================================
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================================
// INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initGlobalEvents();

  // Check if user is already authenticated
  if (isAuthenticated()) {
    window.appState.user = getCurrentUser();
    initDashboard();
  } else {
    initLogin();
  }
});
