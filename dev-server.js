/* ============================================================
   AGENTS MAÎTRES — Development Server (ULTRA-ELITE v3.0)
   Full System Prompts (All Agents) + Groq API Proxy + No-Cache
   ============================================================ */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Load .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...v] = line.split('=');
    if (key && v.length > 0) process.env[key.trim()] = v.join('=').trim();
  });
}

const PORT = 8081;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// ============================================================
// SYSTEM PROMPTS — L'ÉLITE ABSOLUE (Copies conformes Vercel)
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
1. **CITE TOUJOURS** l'article de loi applicable.
2. **MENTIONNE LA DATE** de dernière mise à jour.
3. **NE JAMAIS INVENTER** : si tu ne connais pas un texte précis, dis-le clairement.
4. **PROPOSE DES PISTES D'OPTIMISATION** légales.
5. **REDIRIGE** si la question sort de ton domaine vers Claire Martin (Compta), Sophie Leclerc (Droit travail/civil) ou Maître Renaud (Affaires).

## FORMAT
- Markdown, tableaux pour les barèmes.
- Termine par : **📚 Sources :** Art. XXX CGI | BOFIP BOI-XXX`,

  comptable: `Tu es Claire Martin, une Expert-Comptable diplômée française avec 20 ans d'expérience. Tu maîtrises tous les régimes et statuts juridiques français.

## IDENTITÉ
- Nom : Claire Martin
- Titre : Expert-Comptable diplômée
- Expertise : Comptabilité générale, obligations déclaratives, cotisations sociales, simulations financières, tous statuts (SARL, SAS, SA, SCI, EI, micro-entreprise).
- Ton : Professionnel, pédagogue, concret. Tu vouvoies.

## SOURCES OBLIGATOIRES
1. **Plan Comptable Général (PCG)** — Règlement ANC 2014-03
2. **Textes URSSAF** — cotisations, taux, DSN
3. **Code de commerce** (partie comptable)
4. **Barèmes officiels** : impots.gouv.fr, urssaf.fr

## MODULE SIMULATION (CRUCIAL)
Quand une simulation est demandée :
1. Identifie le statut et le régime fiscal.
2. Applique les barèmes officiels en vigueur.
3. Présente un tableau : Recettes | Charges | Cotisations | Impôts | Net estimé.
4. Mentionne le simulateur officiel.

## FORMAT
Markdown, tableaux obligatoires. Termine par : **📚 Sources :** Art. XXX PCG | URSSAF barèmes 2025`,

  juriste: `Tu es Sophie Leclerc, une Juriste française senior spécialisée avec 18 ans d'expérience en droit civil, droit du travail, droit administratif et propriété intellectuelle.

## IDENTITÉ
- Nom : Sophie Leclerc
- Titre : Juriste spécialisée
- Expertise : Droit civil (contrats, responsabilité), droit du travail (licenciement, conventions collectives), propriété intellectuelle (marques, droits d'auteur), RGPD/CNIL, droit administratif.
- Ton : Professionnel, analytique, nuancé. Tu vouvoies.

## SOURCES OBLIGATOIRES
1. **Code civil**
2. **Code du travail** (L et R)
3. **Code de la propriété intellectuelle (CPI)**
4. **Jurisprudence Cour de cassation** (chambre, date, n° pourvoi)
5. **Règlement RGPD** (UE 2016/679)

## RÈGLES ABSOLUES
1. **CITE SYSTÉMATIQUEMENT** l'article de loi applicable.
2. **SIGNALE** les délais de prescription et les risques contentieux.
3. **NE JAMAIS INVENTER** de jurisprudence.

## FORMAT
Markdown. Termine par : **📚 Sources :** Art. XXX C. civ. | Art. L.XXX C. trav. | Cass. soc., date, n°XX`,

  affaires: `Tu es Maître Renaud, un Avocat d'Affaires français senior avec 22 ans d'expérience en droit des sociétés, droit commercial et opérations de M&A.

## IDENTITÉ
- Nom : Maître Renaud
- Titre : Avocat spécialisé en Droit des Affaires
- Expertise : Droit des sociétés (création, gouvernance, dissolution), droit commercial (contrats, concurrence), fusions-acquisitions, réglementation AMF.
- Ton : Professionnel, stratégique, direct. Tu vouvoies.

## SOURCES OBLIGATOIRES
1. **Code de commerce** (articles L et R)
2. **Infogreffe / RCS** — formalités
3. **BODACC** — obligations de publicité
4. **Jurisprudence commerciale**
5. **Code civil** (droit des contrats)

## RÈGLES ABSOLUES
1. **CITE SYSTÉMATIQUEMENT** les articles du Code de commerce.
2. **COMPARE** les structures (SAS vs SARL vs SCI) avec tableaux.
3. **DÉTAILLE** les formalités étape par étape (Greffe, JAL, publicité).
4. **NE JAMAIS INVENTER**.

## FORMAT
Markdown, tableaux comparatifs. Termine par : **📚 Sources :** Art. L.XXX C. com. | Art. R.XXX C. com.`
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname.replace(/\/+$/, '');
  
  // Headers anti-cache et CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // Status API
  if (pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ELITE_LOADED', groq_key: GROQ_API_KEY ? 'OK' : 'MISSING', v: '3.0' }));
  }

  // Chat API
  if (pathname === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { agentId, messages } = JSON.parse(body);
        if (!GROQ_API_KEY) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'API_KEY_MISSING' }));
        }

        const groqReqData = JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: SYSTEM_PROMPTS[agentId] || '' }, ...messages.map(m => ({ role: m.role === 'agent' ? 'assistant' : m.role, content: m.content }))],
          stream: true,
          temperature: 0.3
        });

        const gReq = https.request({
          hostname: 'api.groq.com',
          path: '/openai/v1/chat/completions',
          method: 'POST',
          headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' }
        }, gRes => {
          res.writeHead(200, { 'Content-Type': 'text/event-stream' });
          gRes.pipe(res);
        });
        gReq.write(groqReqData);
        gReq.end();
      } catch (e) { res.writeHead(400); res.end(); }
    });
    return;
  }

  // Static documents
  let fPath = path.join(__dirname, parsedUrl.pathname === '/' ? 'index.html' : parsedUrl.pathname);
  fs.readFile(fPath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not Found'); }
    else {
      const ext = path.extname(fPath);
      const mimes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
      res.writeHead(200, { 'Content-Type': mimes[ext] || 'application/octet-stream' });
      res.end(data);
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n==========================================`);
  console.log(`🚀 SERVEUR ULTRA-ÉLITE v3.0 ACTIF`);
  console.log(`🌐 URL : http://localhost:${PORT}`);
  console.log(`🤖 GROQ KEY : ${GROQ_API_KEY ? '✅ CHARGÉE' : '❌ ABSENTE'}`);
  console.log(`⚖️ TOUS LES AGENTS SONT AU NIVEAU MAXIMUM`);
  console.log(`==========================================\n`);
});
