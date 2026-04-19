/* ============================================================
   AGENTS MAÎTRES — Chat Engine (v2 — Streaming)
   Message sending, streaming rendering, markdown parsing
   ============================================================ */

import { getAgent } from './agents.js';
import { saveMessage, getMessages } from './history.js';
import { VoiceSynthesis, VoiceRecognition } from './voice.js';
import { extractTextFromFile } from './documents.js';

const synth = new VoiceSynthesis();
let currentFileContext = null;
import { callAgentAPI, extractSources } from './api.js';

// ============================================================
// MARKDOWN PARSER — Robust block-level + inline processing
// ============================================================

// Process inline markdown (bold, italic, code, links)
function inlineMarkdown(text) {
  if (!text) return '';
  let html = text;

  // Inline code (before bold/italic to avoid conflicts)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic (avoid matching ** or list markers)
  html = html.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  return html;
}

// Escape HTML for code blocks
function escapeCodeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Parse markdown to HTML — robust block-level parser for LLM output
function parseMarkdown(text) {
  if (!text) return '';

  const lines = text.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code blocks
    if (trimmed.startsWith('```')) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push('<pre><code>' + escapeCodeHtml(codeLines.join('\n')) + '</code></pre>');
      i++; // skip closing ```
      continue;
    }

    // Tables — detect header row followed by separator row
    if (trimmed.startsWith('|') && i + 1 < lines.length && /^\|[\s:]*[-]+/.test(lines[i + 1].trim())) {
      const headerCells = line.split('|').map(c => c.trim()).filter(Boolean);
      i += 2; // Skip header and separator
      const bodyRows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const cells = lines[i].split('|').map(c => c.trim()).filter(Boolean);
        bodyRows.push(cells);
        i++;
      }
      let table = '<div class="table-wrapper"><table><thead><tr>';
      headerCells.forEach(h => { table += `<th>${inlineMarkdown(h)}</th>`; });
      table += '</tr></thead><tbody>';
      bodyRows.forEach(row => {
        table += '<tr>';
        row.forEach(cell => { table += `<td>${inlineMarkdown(cell)}</td>`; });
        // Pad missing cells
        for (let j = row.length; j < headerCells.length; j++) {
          table += '<td></td>';
        }
        table += '</tr>';
      });
      table += '</tbody></table></div>';
      blocks.push(table);
      continue;
    }

    // Headers
    if (/^#{1,5} /.test(trimmed)) {
      const match = trimmed.match(/^(#{1,5}) (.+)/);
      if (match) {
        const level = match[1].length + 1;
        const tag = `h${Math.min(level, 6)}`;
        blocks.push(`<${tag}>${inlineMarkdown(match[2])}</${tag}>`);
        i++;
        continue;
      }
    }

    // Horizontal rule
    if (/^---+$/.test(trimmed)) {
      blocks.push('<hr>');
      i++;
      continue;
    }

    // Unordered lists
    if (/^\s*[-*•] /.test(line)) {
      const listItems = [];
      while (i < lines.length && /^\s*[-*•] /.test(lines[i])) {
        const content = lines[i].replace(/^\s*[-*•] /, '');
        listItems.push(`<li>${inlineMarkdown(content)}</li>`);
        i++;
      }
      blocks.push(`<ul>${listItems.join('')}</ul>`);
      continue;
    }

    // Ordered lists
    if (/^\s*\d+[\.\)] /.test(line)) {
      const listItems = [];
      while (i < lines.length && /^\s*\d+[\.\)] /.test(lines[i])) {
        const content = lines[i].replace(/^\s*\d+[\.\)] /, '');
        listItems.push(`<li>${inlineMarkdown(content)}</li>`);
        i++;
      }
      blocks.push(`<ol>${listItems.join('')}</ol>`);
      continue;
    }

    // Empty lines
    if (trimmed === '') {
      i++;
      continue;
    }

    // Regular paragraph — collect consecutive non-empty, non-block lines
    const paraLines = [];
    while (i < lines.length &&
           lines[i].trim() !== '' &&
           !lines[i].trim().startsWith('#') &&
           !lines[i].trim().startsWith('|') &&
           !lines[i].trim().startsWith('```') &&
           !/^\s*[-*•] /.test(lines[i]) &&
           !/^\s*\d+[\.\)] /.test(lines[i]) &&
           !/^---+$/.test(lines[i].trim())) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push(`<p>${inlineMarkdown(paraLines.join('<br>'))}</p>`);
    }
  }

  return blocks.join('');
}

// ============================================================
// MESSAGE ELEMENTS
// ============================================================

// Create message DOM element
function createMessageElement(message, agentId) {
  const agent = getAgent(agentId);
  const div = document.createElement('div');
  div.className = `message message-${message.role}`;
  div.dataset.messageId = message.id || '';

  if (message.role === 'user') {
    div.innerHTML = `
      <div class="message-content">
        <div class="message-bubble">${escapeHtml(message.content)}</div>
        <span class="message-time">${formatTime(message.timestamp)}</span>
      </div>
      <div class="message-avatar" style="background: var(--accent-gold-muted); display: flex; align-items: center; justify-content: center; color: var(--accent-gold); font-size: 0.75rem; font-weight: 600; width: 32px; height: 32px; border-radius: 9999px; flex-shrink: 0;">
        ${window.appState?.user?.initials || 'U'}
      </div>
    `;
  } else {
    const sourcesHtml = message.sources && message.sources.length > 0
      ? `<div class="message-sources">${message.sources.map(s => `<span class="badge badge-source">${s}</span>`).join('')}</div>`
      : '';

    const transferHtml = message.transfer
      ? `<div class="message-transfer">
          <p>↗️ Suggestion de transfert vers <strong>${message.transfer.targetAgentName}</strong></p>
          <button class="btn btn-transfer" data-transfer-agent="${message.transfer.targetAgentId}">
            <span class="transfer-icon">↗️</span>
            Transférer
          </button>
        </div>`
      : '';

    div.innerHTML = `
      <img class="message-avatar" src="${agent.avatar}" alt="${agent.name}" style="width:32px;height:32px;border-radius:9999px;flex-shrink:0;object-fit:cover;" onerror="this.style.display='none'">
      <div class="message-content">
        <div class="message-bubble">${parseMarkdown(message.content)}</div>
        
        <div class="message-actions">
          <button class="action-btn btn-export-pdf" title="Exporter en PDF">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            PDF
          </button>
          <button class="action-btn btn-speak" title="Écouter la réponse">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            Écouter
          </button>
        </div>

        ${sourcesHtml}
        ${transferHtml}
        <span class="message-time">${formatTime(message.timestamp)}</span>
      </div>
    `;
  }

  // Add event listeners to action buttons
  const exportBtn = div.querySelector('.btn-export-pdf');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportToPDF(div, getAgent(message.agentId));
    });
  }

  const speakBtn = div.querySelector('.btn-speak');
  if (speakBtn) {
    speakBtn.addEventListener('click', () => {
      synth.speak(message.content);
    });
  }

  return div;
}

// Create a streaming message element (initially empty)
function createStreamingMessageElement(agentId) {
  const agent = getAgent(agentId);
  const div = document.createElement('div');
  div.className = 'message message-agent';
  div.id = 'streaming-message';

  div.innerHTML = `
    <img class="message-avatar" src="${agent.avatar}" alt="${agent.name}" style="width:32px;height:32px;border-radius:9999px;flex-shrink:0;object-fit:cover;" onerror="this.style.display='none'">
    <div class="message-content">
      <div class="message-bubble">
        <div class="loader">
          <div class="loader-dot"></div>
          <div class="loader-dot"></div>
          <div class="loader-dot"></div>
        </div>
      </div>
      <div class="message-sources" style="display:none;"></div>
      <span class="message-time">${formatTime(new Date().toISOString())}</span>
    </div>
  `;

  return div;
}

// ============================================================
// STREAMING UPDATES
// ============================================================
let streamingRawContent = '';
let renderTimer = null;

function updateStreamingMessage(element, fullContent) {
  const bubble = element.querySelector('.message-bubble');
  if (!bubble) return;

  streamingRawContent = fullContent;

  // Debounce rendering (every 60ms max for smooth streaming)
  if (!renderTimer) {
    renderTimer = setTimeout(() => {
      renderTimer = null;
      bubble.innerHTML = parseMarkdown(streamingRawContent);

      // Scroll to bottom
      const container = document.getElementById('chat-messages-list');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 60);
  }
}

// Finalize streaming message (parse sources, save to history)
function finalizeStreamingMessage(element, fullContent, conversationId, agentId) {
  // Cancel any pending render timer
  if (renderTimer) {
    clearTimeout(renderTimer);
    renderTimer = null;
  }
  streamingRawContent = '';

  const bubble = element.querySelector('.message-bubble');
  if (bubble) {
    bubble.innerHTML = parseMarkdown(fullContent);
  }

  // Extract and display sources
  const sources = extractSources(fullContent);
  const sourcesContainer = element.querySelector('.message-sources');
  if (sourcesContainer && sources.length > 0) {
    sourcesContainer.style.display = 'flex';
    sourcesContainer.innerHTML = sources.map(s => `<span class="badge badge-source">${s}</span>`).join('');
  }

  // Detect transfer suggestions in the response
  let transfer = null;
  const transferPatterns = [
    { pattern: /Claire Martin.*Expert[e]?\s*Comptable/i, agentId: 'comptable', name: 'Claire Martin', title: 'Expert Comptable' },
    { pattern: /Maître Duval.*Avocat\s*Fiscal/i, agentId: 'fiscal', name: 'Maître Duval', title: 'Avocat Fiscalité' },
    { pattern: /Sophie Leclerc.*Juriste/i, agentId: 'juriste', name: 'Sophie Leclerc', title: 'Juriste' },
    { pattern: /Maître Renaud.*Avocat.*Affaires/i, agentId: 'affaires', name: 'Maître Renaud', title: 'Avocat Affaires' },
  ];

  for (const tp of transferPatterns) {
    if (tp.agentId !== agentId && tp.pattern.test(fullContent)) {
      transfer = { targetAgentId: tp.agentId, targetAgentName: tp.name, targetAgentTitle: tp.title };
      break;
    }
  }

  if (transfer) {
    const transferHtml = document.createElement('div');
    transferHtml.className = 'message-transfer';
    transferHtml.innerHTML = `
      <p>↗️ Suggestion de transfert vers <strong>${transfer.targetAgentName}</strong> (${transfer.targetAgentTitle})</p>
      <button class="btn btn-transfer" data-transfer-agent="${transfer.targetAgentId}">
        <span class="transfer-icon">↗️</span>
        Transférer
      </button>
    `;
    element.querySelector('.message-content').insertBefore(transferHtml, element.querySelector('.message-time'));
  }

  // Remove streaming ID
  element.removeAttribute('id');

  // Save to history
  addMessage(conversationId, {
    role: 'agent',
    content: fullContent,
    sources,
    transfer
  });

  // Update sidebar
  if (window.updateSidebar) window.updateSidebar();
}

// ============================================================
// SEND MESSAGE (with streaming)
// ============================================================
async function sendMessage(conversationId, agentId, content) {
  const messagesContainer = document.getElementById('chat-messages-list');
  if (!messagesContainer) return;

  // Prepare final prompt with document context if available
  let finalContent = content;
  if (currentFileContext) {
    finalContent = `[CONTEXTE DOCUMENTAIRE RÉFÉRENCE: ${currentFileContext.name}]\nContenu du document :\n${currentFileContext.content}\n\n[FIN DU CONTEXTE]\n\nUtilisateur : ${content}`;
    
    // Reset file context after sending
    currentFileContext = null;
    document.getElementById('file-preview-area').style.display = 'none';
    document.getElementById('file-upload-input').value = '';
  }

  // Add user message to history
  const userMsg = addMessage(conversationId, {
    role: 'user',
    content: content
  });

  // Render user message
  const userElement = createMessageElement(userMsg, agentId);
  messagesContainer.appendChild(userElement);
  scrollToBottom(messagesContainer);

  // Create streaming agent message (starts with typing indicator)
  const streamingEl = createStreamingMessageElement(agentId);
  messagesContainer.appendChild(streamingEl);
  scrollToBottom(messagesContainer);

  // Disable input while waiting
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send-btn');
  if (input) input.disabled = true;
  if (sendBtn) sendBtn.disabled = true;

  // Get conversation history for context
  const conversation = getConversation(conversationId);
  const contextMessages = conversation ? conversation.messages.map(m => ({
    role: m.role === 'agent' ? 'assistant' : m.role,
    content: m.content
  })) : [{ role: 'user', content: finalContent }];

  // Streaming content accumulator
  let fullContent = '';
  let firstToken = true;

  await callAgentAPI(
    agentId,
    contextMessages,
    // onToken
    (token, mode) => {
      if (mode) updateAgentStatusUI(mode);
      
      if (firstToken) {
        const bubble = streamingEl.querySelector('.message-bubble');
        if (bubble) bubble.innerHTML = '';
        firstToken = false;
      }
      fullContent += token;
      updateStreamingMessage(streamingEl, fullContent);
    },
    // onComplete
    (completedContent, mode) => {
      fullContent = completedContent;
      finalizeStreamingMessage(streamingEl, fullContent, conversationId, agentId);

      if (input) {
        input.disabled = false;
        input.focus();
      }
      if (sendBtn) sendBtn.disabled = false;

      // Update UI status indicator
      updateAgentStatusUI(mode);
    },
    // onError
    (error) => {
      console.error('Chat error:', error);
      const bubble = streamingEl.querySelector('.message-bubble');
      if (bubble) {
        bubble.innerHTML = `<p style="color: var(--error);">⚠️ Erreur : ${error.message || 'Impossible de générer une réponse.'}. Veuillez réessayer.</p>`;
      }

      if (input) {
        input.disabled = false;
        input.focus();
      }
      if (sendBtn) sendBtn.disabled = false;

      if (window.showToast) {
        window.showToast('Erreur lors de la génération de la réponse.', 'error');
      }
    }
  );
}

// Render all messages for a conversation
function renderMessages(conversation, agentId) {
  const messagesContainer = document.getElementById('chat-messages-list');
  if (!messagesContainer) return;

  messagesContainer.innerHTML = '';

  if (!conversation.messages || conversation.messages.length === 0) {
    renderWelcome(agentId);
    return;
  }

  conversation.messages.forEach(msg => {
    const element = createMessageElement(msg, agentId);
    messagesContainer.appendChild(element);
  });

  scrollToBottom(messagesContainer);
}

// Render welcome screen
function renderWelcome(agentId) {
  const agent = getAgent(agentId);
  const messagesContainer = document.getElementById('chat-messages-list');
  if (!messagesContainer || !agent) return;

  const welcomeDiv = document.createElement('div');
  welcomeDiv.className = 'chat-welcome';
  welcomeDiv.innerHTML = `
    <img class="welcome-avatar" src="${agent.avatar}" alt="${agent.name}" style="--agent-color: ${agent.color}" onerror="this.style.display='none'">
    <h2>Bienvenue, je suis ${agent.name}</h2>
    <p>${agent.description}</p>
    <div class="welcome-suggestions">
      ${agent.suggestions.map(s => `<button class="suggestion-chip" data-suggestion="${escapeAttr(s)}">${s}</button>`).join('')}
    </div>
  `;

  messagesContainer.appendChild(welcomeDiv);
}

// ============================================================
// UTILITIES
// ============================================================
function scrollToBottom(container) {
  requestAnimationFrame(() => {
    container.scrollTop = container.scrollHeight;
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeAttr(text) {
  return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ============================================================
// STATUS UI UPDATE
// ============================================================
function updateAgentStatusUI(mode) {
  const statusEl = document.getElementById('chat-agent-status');
  if (!statusEl) return;

  statusEl.classList.remove('status-live', 'status-simulation');

  if (mode === 'groq') {
    statusEl.textContent = 'En ligne (Groq AI)';
    statusEl.classList.add('status-live');
  } else {
    statusEl.textContent = 'Mode Simulation (Clé manquante)';
    statusEl.classList.add('status-simulation');
    
    // Explicit warning in console
    console.warn('Utilisation du mode simulation local. Vérifiez vos variables d\'environnement Vercel.');
  }
}

// ============================================================
// PDF EXPORT UTILITY
// ============================================================
function exportToPDF(messageElement, agent) {
  const bubble = messageElement.querySelector('.message-bubble');
  if (!bubble) return;

  // Create a professional container for the PDF
  const container = document.createElement('div');
  container.style.padding = '40px';
  container.style.color = '#0D0D0D';
  container.style.backgroundColor = '#FFFFFF';
  container.style.fontFamily = 'Arial, sans-serif';

  const date = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  container.innerHTML = `
    <div style="border-bottom: 2px solid #C9A84C; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1 style="margin: 0; font-size: 24px;">AGENTS <span style="color: #C9A84C;">MAÎTRES</span></h1>
        <p style="margin: 5px 0 0; font-size: 14px; color: #666;">Conseil Juridique & Fiscal IA</p>
      </div>
      <div style="text-align: right;">
        <p style="margin: 0; font-weight: bold;">Le ${date}</p>
      </div>
    </div>
    
    <div style="margin-bottom: 30px;">
      <h2 style="margin: 0; font-size: 18px; color: #444;">Avis de ${agent.name}</h2>
      <p style="margin: 5px 0 0; font-size: 14px; color: #888;">${agent.title}</p>
    </div>

    <div style="line-height: 1.6; font-size: 14px;">
      ${bubble.innerHTML}
    </div>

    <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #EEE; font-size: 12px; color: #999; text-align: center;">
      <p>Agents Maîtres — Expertise sourcée et certifiée. Document généré le ${date}.</p>
      <p>Note : Ce document est une synthèse indicative générée par IA. Consultez un professionnel pour vos démarches officielles.</p>
    </div>
  `;

  // Fix table styling for PDF (html2pdf sometimes struggles with flex/grid)
  const tables = container.querySelectorAll('table');
  tables.forEach(t => {
    t.style.borderCollapse = 'collapse';
    t.style.width = '100%';
    t.style.marginBottom = '20px';
    t.querySelectorAll('th, td').forEach(cell => {
      cell.style.border = '1px solid #ddd';
      cell.style.padding = '8px';
      cell.style.textAlign = 'left';
    });
    t.querySelectorAll('th').forEach(th => th.style.backgroundColor = '#f9f9f9');
  });

  const opt = {
    margin: 10,
    filename: `Agents_Maitres_Avis_${agent.id}_${new Date().getTime()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(container).save();
}

/**
 * Initialize new features (Voice, Documents)
 */
function initV3Features() {
  const voiceBtn = document.getElementById('voice-btn');
  const attachBtn = document.getElementById('attach-btn');
  const fileInput = document.getElementById('file-upload-input');
  const chatInput = document.getElementById('chat-input');
  const removeFileBtn = document.getElementById('remove-file-btn');
  const filePreview = document.getElementById('file-preview-area');
  const fileNameDisplay = document.getElementById('preview-file-name');

  if (!voiceBtn || !attachBtn || !chatInput) {
    console.warn('V3 indicators not found in DOM yet.');
    return;
  }

  // Voice Interaction
  const recognition = new VoiceRecognition(
    (transcript) => {
      chatInput.value += (chatInput.value ? ' ' : '') + transcript;
      chatInput.dispatchEvent(new Event('input')); // Trigger resize
    },
    (isListening) => {
      voiceBtn.classList.toggle('listening', isListening);
    }
  );

  voiceBtn.onclick = () => recognition.toggle();

  // Document Analysis
  attachBtn.onclick = () => fileInput.click();

  fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      fileNameDisplay.textContent = `Analyse de ${file.name}...`;
      filePreview.style.display = 'block';
      
      const text = await extractTextFromFile(file);
      currentFileContext = {
        name: file.name,
        content: text
      };

      fileNameDisplay.textContent = file.name;
    } catch (err) {
      alert(err.message);
      filePreview.style.display = 'none';
      currentFileContext = null;
    }
  };

  removeFileBtn.onclick = () => {
    currentFileContext = null;
    filePreview.style.display = 'none';
    fileInput.value = '';
  };
}

export { sendMessage, renderMessages, renderWelcome, parseMarkdown, updateAgentStatusUI, initV3Features };

