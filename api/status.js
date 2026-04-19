// ============================================================
// AGENTS MAÎTRES — Diagnostic Endpoint
// Checks for environment variables visibility
// ============================================================

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  
  const status = {
    env: {
      GROQ_API_KEY: GROQ_API_KEY ? 'VALIDE (présente)' : 'MANQUANTE (non configurée)',
      NODE_ENV: process.env.NODE_ENV || 'unknown',
    },
    system: {
      timestamp: new Date().toISOString(),
      runtime: 'Vercel Edge',
    }
  };

  return new Response(JSON.stringify(status, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
