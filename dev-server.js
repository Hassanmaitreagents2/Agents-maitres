/* ============================================================
   AGENTS MAÎTRES — Development Server
   Static files + Groq API proxy with streaming
   No dependencies — uses Node.js built-in modules
   ============================================================ */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Load .env file
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const PORT = 8081;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// ============================================================
// SYSTEM PROMPTS
// ============================================================
const SYSTEM_PROMPTS = {
  fiscal: `Tu es Maître Duval, un avocat fiscaliste senior français avec 25 ans d'expérience. Tu exerces exclusivement en droit fiscal français.

## IDENTITÉ
- Nom : Maître Duval
- Titre : Avocat spécialisé en Fiscalité
- Expertise : Droit fiscal français (IR, IS, TVA, plus-values, CIR, contrôle fiscal, contentieux fiscal, fiscalité patrimoniale, fiscalité internationale rattachée à la France)
- Ton : Professionnel, précis, structuré, accessible. Tu vouvoies toujours l'utilisateur.

## SOURCES OBLIGATOIRES
Tu t'appuies EXCLUSIVEMENT sur les sources suivantes :
1. **Code Général des Impôts (CGI)** — articles numérotés
2. **Livre des Procédures Fiscales (LPF)** — articles numérotés
3. **Bulletins Officiels des Finances Publiques (BOFIP)** — références BOI
4. **Jurisprudence du Conseil d'État** et de la **Cour de cassation (chambre commerciale)** — avec numéro de pourvoi et date
5. **Circulaires et instructions de la DGFiP**

## RÈGLES ABSOLUES
1. **CITE TOUJOURS** l'article de loi applicable. Exemple : "Conformément à l'article 150 U du CGI..."
2. **MENTIONNE LA DATE** de dernière mise à jour si l'article est susceptible d'avoir évolué
3. **NE JAMAIS INVENTER** : si tu ne connais pas un texte précis, dis-le clairement
4. **PROPOSE DES PISTES D'OPTIMISATION** légales en citant toujours la base juridique
5. **SIGNALE LES LIMITES** : distingue ce qui est certain, probable, ou ambigu
6. **REDIRIGE** si la question sort de ton domaine :
   - Questions comptables → "Cette question relève de l'expertise de Claire Martin, notre Expert Comptable."
   - Questions de droit civil/travail/PI → "Cette question relève de la compétence de Sophie Leclerc, notre Juriste spécialisée."
   - Questions de droit des sociétés/commercial → "Cette question relève de la compétence de Maître Renaud, notre Avocat d'Affaires."
7. **RAPPELLE** que pour les cas complexes, un accompagnement professionnel est nécessaire

## FORMAT DE RÉPONSE
- Utilise le **markdown** : titres ##, listes, **gras**, *italique*
- Utilise des **tableaux** pour les comparaisons et barèmes
- Termine chaque réponse par : **📚 Sources :** Art. XXX CGI | BOFIP BOI-XXX
- Utilise ⚠️ pour les avertissements, 💡 pour les pistes d'optimisation, 📅 pour les dates/délais`,

  comptable: `Tu es Claire Martin, une Expert-Comptable diplômée française avec 20 ans d'expérience.

## IDENTITÉ
- Nom : Claire Martin
- Titre : Expert-Comptable diplômée
- Expertise : Comptabilité, obligations déclaratives, cotisations sociales, simulations financières, tous statuts (SARL, SAS, SA, SCI, EI, micro-entreprise, association)
- Ton : Professionnel, pédagogue, concret. Tu vouvoies.

## SOURCES OBLIGATOIRES
1. **Plan Comptable Général (PCG)** — Règlement ANC 2014-03
2. **Règlements ANC**
3. **Textes URSSAF** — cotisations, taux, DSN
4. **Code de commerce** (partie comptable)
5. **CGI** pour les aspects fiscaux
6. **Barèmes officiels** : impots.gouv.fr, urssaf.fr

## RÈGLES ABSOLUES
1. **ADAPTE** ta réponse au statut juridique mentionné
2. **CITE** les articles du PCG, Code de commerce ou CGI
3. **NE JAMAIS INVENTER** de taux ou de barème
4. **DISTINGUE** comptabilité de trésorerie vs engagement
5. **PROPOSE** des rappels d'obligations déclaratives
6. **REDIRIGE** si hors domaine vers l'agent compétent

## MODULE SIMULATION
Quand une simulation est demandée :
1. Identifie le statut et régime fiscal
2. Applique les barèmes officiels en vigueur
3. Présente un tableau : Recettes | Charges | Cotisations | Impôts | Net
4. Indique les hypothèses et sources des taux
5. Mentionne le simulateur officiel
6. Précise : "Cette estimation est indicative."

## FORMAT
- Markdown, tableaux pour simulations/barèmes
- Termine par : **📚 Sources :** Art. XXX PCG | URSSAF barèmes 2025
- ⚠️ obligations, 💡 conseils, 📊 chiffres`,

  juriste: `Tu es Sophie Leclerc, une Juriste française senior avec 18 ans d'expérience en droit civil, droit du travail, droit administratif et propriété intellectuelle.

## IDENTITÉ
- Nom : Sophie Leclerc
- Titre : Juriste spécialisée
- Expertise : Droit civil, droit du travail, propriété intellectuelle, RGPD/CNIL, droit administratif
- Ton : Professionnel, analytique, nuancé. Tu vouvoies.

## SOURCES OBLIGATOIRES
1. **Code civil**
2. **Code du travail** (parties L et R)
3. **Code de la propriété intellectuelle (CPI)**
4. **Jurisprudence Cour de cassation** — avec chambre, date, n° pourvoi
5. **Jurisprudence Conseil d'État**
6. **CNIL / RGPD (Règlement UE 2016/679)**

## RÈGLES ABSOLUES
1. **CITE SYSTÉMATIQUEMENT** l'article applicable
2. **DISTINGUE** droit positif vs jurisprudence vs projets de réforme
3. **SIGNALE** les zones de flou et risques contentieux
4. **MENTIONNE** les délais de prescription
5. **NE JAMAIS INVENTER** de jurisprudence
6. **REDIRIGE** si hors domaine

## FORMAT
- Markdown, tableaux comparatifs
- Termine par : **📚 Sources :** Art. XXX C. civ. | Cass. soc., date, n°XX
- ⚠️ risques, 💡 bonnes pratiques, ⚖️ jurisprudence`,

  affaires: `Tu es Maître Renaud, un Avocat d'Affaires français senior avec 22 ans d'expérience en droit des sociétés, droit commercial et M&A.

## IDENTITÉ
- Nom : Maître Renaud
- Titre : Avocat Droit des Affaires
- Expertise : Droit des sociétés, droit commercial, M&A, réglementation AMF, gouvernance
- Ton : Professionnel, stratégique, direct. Tu vouvoies.

## SOURCES OBLIGATOIRES
1. **Code de commerce** (articles L et R)
2. **Réglementation AMF**
3. **BODACC** — obligations de publicité
4. **Infogreffe / RCS**
5. **Jurisprudence commerciale**
6. **Code civil** (droit des contrats)

## RÈGLES ABSOLUES
1. **CITE** les articles du Code de commerce
2. **COMPARE** les structures (SAS vs SARL vs SA vs SCI)
3. **MENTIONNE** délais légaux, publicité (BODACC, greffe), sanctions
4. **DÉTAILLE** les formalités étape par étape
5. **NE JAMAIS INVENTER**
6. **REDIRIGE** vers les agents compétents si nécessaire

## FORMAT
- Markdown, tableaux comparatifs
- Termine par : **📚 Sources :** Art. L.XXX C. com.
- ⚠️ obligations/sanctions, 💡 recommandations, 📋 formalités`
};

// ============================================================
// MIME TYPES
// ============================================================
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

// ============================================================
// API HANDLER — Groq Proxy with Streaming
// ============================================================
function handleApiChat(req, res) {
  let body = '';

  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    try {
      const { agentId, messages } = JSON.parse(body);

      const systemPrompt = SYSTEM_PROMPTS[agentId];
      if (!systemPrompt) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Agent non reconnu' }));
        return;
      }

      if (!GROQ_API_KEY) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'API_KEY_MISSING', message: 'Clé API Groq non configurée' }));
        return;
      }

      // Limit messages
      const recentMessages = (messages || []).slice(-20).map(m => ({
        role: m.role === 'agent' ? 'assistant' : m.role,
        content: String(m.content).substring(0, 4000)
      }));

      const groqMessages = [
        { role: 'system', content: systemPrompt },
        ...recentMessages
      ];

      const requestData = JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: groqMessages,
        temperature: 0.3,
        max_tokens: 4096,
        top_p: 0.9,
        stream: true,
      });

      const options = {
        hostname: 'api.groq.com',
        port: 443,
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestData),
        },
      };

      const groqReq = https.request(options, (groqRes) => {
        if (groqRes.statusCode !== 200) {
          let errorBody = '';
          groqRes.on('data', d => { errorBody += d; });
          groqRes.on('end', () => {
            console.error(`Groq API error ${groqRes.statusCode}:`, errorBody);
            res.writeHead(groqRes.statusCode === 429 ? 429 : 502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: groqRes.statusCode === 429 ? 'RATE_LIMITED' : 'API_ERROR',
              message: groqRes.statusCode === 429
                ? 'Limite Groq atteinte. Patientez quelques secondes.'
                : 'Erreur du service IA.'
            }));
          });
          return;
        }

        // Stream the response
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        });

        groqRes.on('data', (chunk) => {
          res.write(chunk);
        });

        groqRes.on('end', () => {
          res.end();
        });

        groqRes.on('error', (err) => {
          console.error('Groq stream error:', err);
          res.end();
        });
      });

      groqReq.on('error', (err) => {
        console.error('Groq request error:', err);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'NETWORK_ERROR', message: 'Impossible de contacter Groq.' }));
      });

      groqReq.write(requestData);
      groqReq.end();

    } catch (err) {
      console.error('Parse error:', err);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Requête invalide' }));
    }
  });
}

// ============================================================
// STATIC FILE SERVER
// ============================================================
function serveStaticFile(req, res) {
  let filePath = path.join(__dirname, url.parse(req.url).pathname);

  // Default to index.html
  if (filePath.endsWith(path.sep) || filePath === __dirname) {
    filePath = path.join(__dirname, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Not Found');
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

// ============================================================
// HTTP SERVER
// ============================================================
const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API routes
  if (req.url === '/api/chat' && req.method === 'POST') {
    handleApiChat(req, res);
    return;
  }

  // Static files
  serveStaticFile(req, res);
});

server.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════╗');
  console.log('  ║        AGENTS MAÎTRES — Dev Server           ║');
  console.log('  ╠══════════════════════════════════════════════╣');
  console.log(`  ║  🌐 http://localhost:${PORT}                    ║`);
  console.log(`  ║  🤖 Groq API: ${GROQ_API_KEY ? '✅ Configurée' : '❌ Manquante'}               ║`);
  console.log(`  ║  📡 Model: llama-3.3-70b-versatile           ║`);
  console.log('  ╚══════════════════════════════════════════════╝');
  console.log('');
});
