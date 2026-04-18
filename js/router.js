/* ============================================================
   AGENTS MAÎTRES — Inter-Agent Router
   Keyword detection, transfer suggestions
   ============================================================ */

import { AGENTS } from './agents.js';

// Detect if a question should be redirected to another agent
function detectRedirect(currentAgentId, userMessage) {
  const agent = AGENTS[currentAgentId];
  if (!agent || !agent.redirectKeywords) return null;

  const messageLower = userMessage.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  for (const [targetAgentId, keywords] of Object.entries(agent.redirectKeywords)) {
    let score = 0;
    const matchedKeywords = [];

    for (const keyword of keywords) {
      if (messageLower.includes(keyword.toLowerCase())) {
        score += keyword.length; // Longer keywords = more specific match
        matchedKeywords.push(keyword);
      }
    }

    if (score > bestScore && matchedKeywords.length >= 1) {
      bestScore = score;
      bestMatch = {
        targetAgentId,
        targetAgent: AGENTS[targetAgentId],
        matchedKeywords,
        confidence: Math.min(matchedKeywords.length / 2, 1) // 0 to 1
      };
    }
  }

  // Only suggest redirect if confidence is reasonable
  if (bestMatch && bestMatch.confidence >= 0.5) {
    return bestMatch;
  }

  return null;
}

// Generate redirect message
function getRedirectMessage(currentAgentId, redirect) {
  const currentAgent = AGENTS[currentAgentId];
  const targetAgent = redirect.targetAgent;

  const messages = [
    `Cette question touche au domaine de **${targetAgent.name}** (${targetAgent.title}), qui serait mieux placé(e) pour vous répondre sur ce point précis.`,
    `Je note que votre question relève davantage de la compétence de **${targetAgent.name}** (${targetAgent.title}). Je vous recommande de la lui transférer pour une réponse plus précise.`,
    `Cette problématique dépasse mon domaine de spécialisation. **${targetAgent.name}** (${targetAgent.title}) dispose de l'expertise nécessaire pour vous accompagner.`
  ];

  return messages[Math.floor(Math.random() * messages.length)];
}

// Get all possible agent targets for current agent
function getTransferTargets(currentAgentId) {
  return Object.keys(AGENTS)
    .filter(id => id !== currentAgentId)
    .map(id => AGENTS[id]);
}

export { detectRedirect, getRedirectMessage, getTransferTargets };
