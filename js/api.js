/* ============================================================
   AGENTS MAÎTRES — API Client (PROD VERSION)
   Groq API integration with heavy focus on connectivity feedback.
   ============================================================ */

const USE_SIMULATION_BACKUP = false; // Disabling by default to avoid confusion
import { generateResponse as simulatedResponse } from './simulation.js';

// API base URL
function getApiUrl() {
  return '/api/chat';
}

// ============================================================
// STREAMING API CALL
// ============================================================
async function callAgentAPI(agentId, messages, onToken, onComplete, onError) {
  const apiUrl = getApiUrl();
  const apiMessages = messages.map(m => ({
    role: m.role,
    content: m.content
  }));

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agentId,
        messages: apiMessages,
      }),
    });

    // Handle errors (non-200)
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();

        // Specific handling for API key
        if (errorData.error === 'API_KEY_MISSING') {
          if (window.showToast) window.showToast('Erreur : Clé API Groq manquante sur le serveur.', 'error');
          if (USE_SIMULATION_BACKUP) {
            return fallbackToSimulation(agentId, messages[messages.length - 1].content, onToken, onComplete, onError);
          }
          throw new Error('Clé API Groq manquante.');
        }

        throw new Error(errorData.message || `Erreur API (${response.status})`);
      }
      throw new Error(`Erreur HTTP ${response.status}`);
    }

    // Check for streaming response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/event-stream')) {
      // Notify UI that we are live
      if (onToken) onToken('', 'groq'); 
      await parseSSEStream(response.body, onToken, (content) => onComplete(content, 'groq'), onError);
    } else {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      onToken(content);
      onComplete(content, 'groq');
    }

  } catch (error) {
    console.error('API call failed:', error);
    
    // Notify UI of the error
    if (window.showToast) {
      window.showToast(`Échec Connexion IA : ${error.message}`, 'error');
    }

    // Should we fall back? Only if explicitly enabled and not an auth error
    if (USE_SIMULATION_BACKUP && !error.message.includes('Clé API')) {
      console.warn('Falling back to simulation despite the error.');
      return fallbackToSimulation(agentId, messages[messages.length - 1].content, onToken, onComplete, onError);
    }

    onError(error);
  }
}

// ============================================================
// SSE STREAM PARSER
// ============================================================
async function parseSSEStream(body, onToken, onComplete, onError) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;

        if (trimmed === 'data: [DONE]') {
          onComplete(fullContent);
          return;
        }

        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6);
          try {
            const data = JSON.parse(jsonStr);
            const delta = data.choices?.[0]?.delta;

            if (delta?.content) {
              fullContent += delta.content;
              onToken(delta.content, 'groq');
            }

            if (data.choices?.[0]?.finish_reason === 'stop') {
              onComplete(fullContent);
              return;
            }
          } catch (parseError) {
            console.debug('Malformed SSE data:', jsonStr);
          }
        }
      }
    }
    if (fullContent) onComplete(fullContent);
  } catch (error) {
    console.error('Stream parsing error:', error);
    if (fullContent) onComplete(fullContent);
    else onError(error);
  }
}

// ============================================================
// FALLBACK TO SIMULATION
// ============================================================
async function fallbackToSimulation(agentId, lastMessage, onToken, onComplete, onError) {
  try {
    if (onToken) onToken('', 'simulation');
    const result = await simulatedResponse(agentId, lastMessage);
    const content = result.content;
    const sources = result.sources || [];
    let index = 0;
    
    return new Promise((resolve) => {
      const timer = setInterval(() => {
        if (index < content.length) {
          const chunk = content.substring(index, index + 3);
          onToken(chunk, 'simulation');
          index += 3;
        } else {
          clearInterval(timer);
          let finalContent = content;
          if (sources.length > 0) finalContent += '\n\n**📚 Sources :** ' + sources.join(' | ');
          onComplete(finalContent, 'simulation');
          resolve();
        }
      }, 10);
    });
  } catch (error) {
    onError(error);
  }
}

// ============================================================
// EXTRACT SOURCES
// ============================================================
function extractSources(content) {
  const sources = [];
  const sourcesLineMatch = content.match(/\*\*📚 Sources?\s*:\*\*\s*(.+?)$/m);
  if (sourcesLineMatch) {
    const parts = sourcesLineMatch[1].split('|').map(s => s.trim()).filter(Boolean);
    sources.push(...parts);
  }
  const articlePatterns = [
    /(?:art(?:icle)?\.?\s+(?:L\.?|R\.?|D\.?)?\s*\d[\d\w\s-]*(?:du\s+)?(?:CGI|LPF|C\.\s*(?:civ|com|trav)|CPI|RGPD|PCG))/gi,
    /(?:BOFIP\s+BOI[-\w]+)/gi,
  ];
  if (sources.length === 0) {
    for (const pattern of articlePatterns) {
      const matches = content.match(pattern);
      if (matches) sources.push(...matches.map(m => m.trim()));
    }
  }
  return [...new Set(sources)].slice(0, 8);
}

export { callAgentAPI, extractSources };
