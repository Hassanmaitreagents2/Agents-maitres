/* ============================================================
   AGENTS MAÎTRES — API Client
   Groq API integration with streaming + fallback to simulation
   ============================================================ */

import { generateResponse as simulatedResponse } from './simulation.js';

// API base URL — auto-detect environment
function getApiUrl() {
  // In production (Vercel), use relative URL
  // In development, use localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Check if Vercel dev server is running (port 3000)
    return '/api/chat';
  }
  return '/api/chat';
}

// ============================================================
// STREAMING API CALL
// ============================================================
async function callAgentAPI(agentId, messages, onToken, onComplete, onError) {
  const apiUrl = getApiUrl();

  // Format messages for the API
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

    // Handle non-streaming errors
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();

        // If API key is missing, fall back to simulation
        if (errorData.error === 'API_KEY_MISSING') {
          console.warn('Groq API key not configured, falling back to simulation');
          return fallbackToSimulation(agentId, messages[messages.length - 1].content, onToken, onComplete, onError);
        }

        throw new Error(errorData.message || 'Erreur API');
      }
      throw new Error(`Erreur HTTP ${response.status}`);
    }

    // Check if we got a streaming response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/event-stream')) {
      // Parse SSE stream
      await parseSSEStream(response.body, onToken, onComplete, onError);
    } else {
      // Non-streaming response (fallback)
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      onToken(content);
      onComplete(content);
    }

  } catch (error) {
    console.error('API call failed:', error);

    // Check if it's a network error (API not reachable)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('API not reachable, falling back to simulation');
      return fallbackToSimulation(agentId, messages[messages.length - 1].content, onToken, onComplete, onError);
    }

    // Try fallback for any error
    console.warn('API error, falling back to simulation:', error.message);
    return fallbackToSimulation(agentId, messages[messages.length - 1].content, onToken, onComplete, onError);
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

      if (done) {
        break;
      }

      // Decode the chunk
      buffer += decoder.decode(value, { stream: true });

      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the incomplete last line in the buffer

      for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith(':')) {
          continue; // Skip empty lines and comments
        }

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
              onToken(delta.content);
            }

            // Check for finish reason
            if (data.choices?.[0]?.finish_reason === 'stop') {
              onComplete(fullContent);
              return;
            }
          } catch (parseError) {
            // Skip malformed JSON
            console.debug('Skipping malformed SSE data:', jsonStr);
          }
        }
      }
    }

    // If we exited the loop without explicit DONE
    if (fullContent) {
      onComplete(fullContent);
    }

  } catch (error) {
    console.error('Stream parsing error:', error);
    if (fullContent) {
      // If we have partial content, complete with what we have
      onComplete(fullContent);
    } else {
      onError(error);
    }
  }
}

// ============================================================
// FALLBACK TO SIMULATION
// ============================================================
async function fallbackToSimulation(agentId, lastMessage, onToken, onComplete, onError) {
  try {
    const result = await simulatedResponse(agentId, lastMessage);
    
    // Simulate streaming with typewriter effect
    const content = result.content;
    const sources = result.sources || [];
    let index = 0;
    const chunkSize = 3; // Characters per tick
    const interval = 8; // ms per tick (fast)

    return new Promise((resolve) => {
      const timer = setInterval(() => {
        if (index < content.length) {
          const chunk = content.substring(index, index + chunkSize);
          onToken(chunk);
          index += chunkSize;
        } else {
          clearInterval(timer);
          // Append sources info if available
          let finalContent = content;
          if (sources.length > 0) {
            finalContent += '\n\n**📚 Sources :** ' + sources.join(' | ');
          }
          onComplete(finalContent);
          resolve();
        }
      }, interval);
    });
  } catch (error) {
    onError(error);
  }
}

// ============================================================
// EXTRACT SOURCES FROM RESPONSE
// ============================================================
function extractSources(content) {
  const sources = [];
  
  // Pattern 1: **📚 Sources :** Art. XXX | Art. YYY
  const sourcesLineMatch = content.match(/\*\*📚 Sources?\s*:\*\*\s*(.+?)$/m);
  if (sourcesLineMatch) {
    const sourcesText = sourcesLineMatch[1];
    const parts = sourcesText.split('|').map(s => s.trim()).filter(Boolean);
    sources.push(...parts);
  }

  // Pattern 2: Individual article references in text
  const articlePatterns = [
    /(?:art(?:icle)?\.?\s+(?:L\.?|R\.?|D\.?)?\s*\d[\d\w\s-]*(?:du\s+)?(?:CGI|LPF|C\.\s*(?:civ|com|trav)|CPI|RGPD|PCG))/gi,
    /(?:BOFIP\s+BOI[-\w]+)/gi,
    /(?:Cass\.\s*(?:soc|com|civ|crim)\.\s*,?\s*\d{1,2}\s*(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s*\d{4})/gi,
  ];

  // Only extract if no explicit sources line was found
  if (sources.length === 0) {
    for (const pattern of articlePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        sources.push(...matches.map(m => m.trim()));
      }
    }
  }

  // Deduplicate
  return [...new Set(sources)].slice(0, 8); // Max 8 sources displayed
}

export { callAgentAPI, extractSources };
