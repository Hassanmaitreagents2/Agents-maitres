/* ============================================================
   AGENTS MAÎTRES — Conversation History
   CRUD operations on localStorage
   ============================================================ */

const HISTORY_KEY = 'agentsmaitres_history';

// Get all conversations
function getAllConversations() {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Save all conversations
function saveAllConversations(conversations) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(conversations));
}

// Get conversations for a specific agent
function getConversationsByAgent(agentId) {
  return getAllConversations()
    .filter(c => c.agentId === agentId)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

// Get a specific conversation by ID
function getConversation(conversationId) {
  return getAllConversations().find(c => c.id === conversationId) || null;
}

// Create a new conversation
function createConversation(agentId) {
  const conversations = getAllConversations();
  const conversation = {
    id: generateId(),
    agentId: agentId,
    title: 'Nouvelle conversation',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  conversations.unshift(conversation);
  saveAllConversations(conversations);
  return conversation;
}

// Update conversation title (auto-generated from first user message)
function updateConversationTitle(conversationId, title) {
  const conversations = getAllConversations();
  const conv = conversations.find(c => c.id === conversationId);
  if (conv) {
    conv.title = title.length > 50 ? title.substring(0, 47) + '...' : title;
    conv.updatedAt = new Date().toISOString();
    saveAllConversations(conversations);
  }
}

// Add a message to a conversation
function addMessage(conversationId, message) {
  const conversations = getAllConversations();
  const conv = conversations.find(c => c.id === conversationId);
  if (conv) {
    const msg = {
      id: generateId(),
      role: message.role, // 'user' or 'agent'
      content: message.content,
      sources: message.sources || [],
      transfer: message.transfer || null,
      timestamp: new Date().toISOString()
    };
    conv.messages.push(msg);
    conv.updatedAt = new Date().toISOString();

    // Auto-title from first user message
    if (message.role === 'user' && conv.messages.filter(m => m.role === 'user').length === 1) {
      conv.title = message.content.length > 50
        ? message.content.substring(0, 47) + '...'
        : message.content;
    }

    saveAllConversations(conversations);
    return msg;
  }
  return null;
}

// Delete a conversation
function deleteConversation(conversationId) {
  const conversations = getAllConversations().filter(c => c.id !== conversationId);
  saveAllConversations(conversations);
}

// Search conversations
function searchConversations(query, agentId = null) {
  const q = query.toLowerCase();
  return getAllConversations().filter(c => {
    if (agentId && c.agentId !== agentId) return false;
    if (c.title.toLowerCase().includes(q)) return true;
    return c.messages.some(m => m.content.toLowerCase().includes(q));
  });
}

// Transfer a conversation to another agent
function transferConversation(conversationId, newAgentId) {
  const conversations = getAllConversations();
  const original = conversations.find(c => c.id === conversationId);
  if (!original) return null;

  // Create new conversation with context
  const newConv = {
    id: generateId(),
    agentId: newAgentId,
    title: `[Transféré] ${original.title}`,
    messages: [...original.messages],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    transferredFrom: {
      conversationId: original.id,
      agentId: original.agentId
    }
  };

  conversations.unshift(newConv);
  saveAllConversations(conversations);
  return newConv;
}

// Helper: generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// Format date for display
function formatDate(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short'
  });
}

// Format time for messages
function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export {
  getAllConversations,
  getConversationsByAgent,
  getConversation,
  createConversation,
  updateConversationTitle,
  addMessage,
  deleteConversation,
  searchConversations,
  transferConversation,
  formatDate,
  formatTime
};
