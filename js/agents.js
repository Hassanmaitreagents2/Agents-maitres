/* ============================================================
   AGENTS MAÎTRES — Agent Definitions
   Metadata, prompts, sources, specialties for all 4 agents
   ============================================================ */

const AGENTS = {
  fiscal: {
    id: 'fiscal',
    name: 'Maître Duval',
    title: 'Avocat Fiscalité',
    description: 'Conseiller fiscal spécialisé en droit fiscal français. Optimisation légale, déclarations, contentieux fiscaux — toujours sur la base du CGI et du BOFIP.',
    icon: '⚖️',
    color: '#C9A84C',
    colorVar: '--agent-fiscal',
    bgVar: '--agent-fiscal-bg',
    avatar: 'assets/avatar-fiscal.png',
    specialties: [
      'Impôt sur le revenu',
      'Impôt sur les sociétés',
      'TVA',
      'Plus-values',
      'Contrôle fiscal',
      'Optimisation fiscale'
    ],
    sources: [
      { name: 'Code Général des Impôts (CGI)', url: 'https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006069577/' },
      { name: 'Livre des Procédures Fiscales', url: 'https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006069583/' },
      { name: 'BOFIP — Impôts', url: 'https://bofip.impots.gouv.fr/' },
      { name: 'Jurisprudence Conseil d\'État', url: 'https://www.legifrance.gouv.fr/search/cetat' },
      { name: 'DGFiP — Instructions fiscales', url: 'https://www.impots.gouv.fr/' }
    ],
    welcomeMessage: 'Bonjour, je suis **Maître Duval**, votre conseiller en fiscalité. Je m\'appuie exclusivement sur le Code Général des Impôts, le BOFIP et la jurisprudence du Conseil d\'État pour vous répondre.\n\nComment puis-je vous aider aujourd\'hui ?',
    suggestions: [
      'Quels sont les abattements applicables aux plus-values immobilières ?',
      'Comment fonctionne le régime micro-BNC ?',
      'Quelles sont les conditions du crédit d\'impôt recherche (CIR) ?',
      'Quels sont les délais de prescription fiscale ?'
    ],
    redirectKeywords: {
      comptable: ['comptabilité', 'bilan', 'compte de résultat', 'liasse fiscale', 'plan comptable', 'écriture comptable', 'PCG', 'cotisations sociales', 'URSSAF', 'DSN', 'bulletin de paie', 'charges sociales'],
      juriste: ['contrat de travail', 'licenciement', 'code du travail', 'RGPD', 'CNIL', 'droit civil', 'bail', 'propriété intellectuelle', 'brevet', 'marque'],
      affaires: ['statuts', 'immatriculation', 'RCS', 'BODACC', 'fusion', 'acquisition', 'pacte d\'associés', 'cession de parts', 'AGE', 'AGO', 'assemblée générale']
    }
  },

  comptable: {
    id: 'comptable',
    name: 'Claire Martin',
    title: 'Expert Comptable',
    description: 'Experte en comptabilité, gestion et obligations déclaratives. Simulations chiffrées, barèmes officiels, accompagnement sur tous les statuts juridiques.',
    icon: '📊',
    color: '#3B82F6',
    colorVar: '--agent-comptable',
    bgVar: '--agent-comptable-bg',
    avatar: 'assets/avatar-comptable.png',
    specialties: [
      'Comptabilité générale',
      'Déclarations fiscales',
      'Cotisations sociales',
      'Simulation financière',
      'Micro-entreprise',
      'Statuts juridiques'
    ],
    sources: [
      { name: 'Plan Comptable Général (ANC)', url: 'http://www.anc.gouv.fr/' },
      { name: 'URSSAF', url: 'https://www.urssaf.fr/' },
      { name: 'impots.gouv.fr', url: 'https://www.impots.gouv.fr/' },
      { name: 'Code de commerce', url: 'https://www.legifrance.gouv.fr/codes/id/LEGITEXT000005634379/' },
      { name: 'autoentrepreneur.urssaf.fr', url: 'https://www.autoentrepreneur.urssaf.fr/' }
    ],
    welcomeMessage: 'Bonjour, je suis **Claire Martin**, votre expert-comptable virtuelle. Je vous accompagne sur la comptabilité, les obligations déclaratives et les simulations financières, en m\'appuyant sur les barèmes officiels en vigueur.\n\n💡 *Je peux réaliser des simulations chiffrées pour estimer vos cotisations, impôts et résultat net.*\n\nQuelle est votre question ?',
    suggestions: [
      'Simuler mes cotisations en micro-entreprise (CA 50 000€)',
      'Quelles sont les échéances déclaratives d\'une SARL ?',
      'Comment comptabiliser une immobilisation amortissable ?',
      'Différence entre comptabilité de trésorerie et d\'engagement ?'
    ],
    redirectKeywords: {
      fiscal: ['optimisation fiscale', 'crédit d\'impôt', 'niche fiscale', 'contentieux fiscal', 'contrôle fiscal', 'prescription fiscale', 'rescrit fiscal', 'abus de droit'],
      juriste: ['contrat de travail', 'licenciement', 'prud\'hommes', 'RGPD', 'CNIL', 'propriété intellectuelle', 'bail commercial', 'troubles de voisinage'],
      affaires: ['fusion', 'acquisition', 'pacte d\'associés', 'cession de fonds', 'concurrence déloyale', 'AMF', 'BODACC', 'injonction']
    }
  },

  juriste: {
    id: 'juriste',
    name: 'Sophie Leclerc',
    title: 'Juriste',
    description: 'Spécialiste en droit civil, droit du travail, droit administratif et propriété intellectuelle. Analyses juridiques rigoureuses basées sur les codes en vigueur.',
    icon: '📜',
    color: '#10B981',
    colorVar: '--agent-juriste',
    bgVar: '--agent-juriste-bg',
    avatar: 'assets/avatar-juriste.png',
    specialties: [
      'Droit civil',
      'Droit du travail',
      'Propriété intellectuelle',
      'RGPD / CNIL',
      'Droit administratif',
      'Contentieux'
    ],
    sources: [
      { name: 'Code civil', url: 'https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006070721/' },
      { name: 'Code du travail', url: 'https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006072050/' },
      { name: 'Code de la propriété intellectuelle', url: 'https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006069414/' },
      { name: 'Jurisprudence Cour de cassation', url: 'https://www.legifrance.gouv.fr/search/juri' },
      { name: 'CNIL', url: 'https://www.cnil.fr/' }
    ],
    welcomeMessage: 'Bonjour, je suis **Sophie Leclerc**, juriste spécialisée. Mon domaine couvre le droit civil, le droit du travail, la propriété intellectuelle et les questions RGPD. Je cite systématiquement les articles applicables.\n\nSur quel sujet juridique puis-je vous éclairer ?',
    suggestions: [
      'Quels sont les délais de préavis en cas de démission ?',
      'Quelles obligations impose le RGPD à une PME ?',
      'Comment protéger une marque en France ?',
      'Quelles sont les conditions de validité d\'un contrat ?'
    ],
    redirectKeywords: {
      fiscal: ['impôt', 'TVA', 'CGI', 'BOFIP', 'plus-value', 'déficit fiscal', 'crédit d\'impôt', 'ISF', 'IFI', 'taxe foncière'],
      comptable: ['comptabilité', 'bilan', 'liasse fiscale', 'cotisations', 'URSSAF', 'DSN', 'plan comptable', 'amortissement', 'écriture comptable'],
      affaires: ['code de commerce', 'SARL', 'SAS', 'SA', 'droit des sociétés', 'fusion', 'acquisition', 'BODACC', 'RCS', 'greffe', 'AMF']
    }
  },

  affaires: {
    id: 'affaires',
    name: 'Maître Renaud',
    title: 'Avocat Affaires',
    description: 'Conseil en droit des sociétés, droit commercial, fusions-acquisitions et contrats commerciaux. Expertise basée sur le Code de commerce et la réglementation AMF.',
    icon: '🏛️',
    color: '#8B5CF6',
    colorVar: '--agent-affaires',
    bgVar: '--agent-affaires-bg',
    avatar: 'assets/avatar-affaires.png',
    specialties: [
      'Droit des sociétés',
      'Droit commercial',
      'Fusions-acquisitions',
      'Contrats commerciaux',
      'Réglementation AMF',
      'Gouvernance'
    ],
    sources: [
      { name: 'Code de commerce', url: 'https://www.legifrance.gouv.fr/codes/id/LEGITEXT000005634379/' },
      { name: 'Réglementation AMF', url: 'https://www.amf-france.org/' },
      { name: 'BODACC', url: 'https://www.bodacc.fr/' },
      { name: 'Infogreffe', url: 'https://www.infogreffe.fr/' },
      { name: 'Jurisprudence commerciale', url: 'https://www.legifrance.gouv.fr/search/juri' }
    ],
    welcomeMessage: 'Bonjour, je suis **Maître Renaud**, avocat spécialisé en droit des affaires. Je vous accompagne sur la création et la gestion de sociétés, les opérations de M&A, les contrats commerciaux et la conformité réglementaire.\n\nQuelle question de droit des affaires souhaitez-vous aborder ?',
    suggestions: [
      'SAS vs SARL : quelles différences juridiques majeures ?',
      'Quelles sont les obligations de publicité au BODACC ?',
      'Comment rédiger un pacte d\'associés efficace ?',
      'Quelles formalités pour une cession de parts sociales ?'
    ],
    redirectKeywords: {
      fiscal: ['impôt', 'TVA', 'CGI', 'optimisation fiscale', 'plus-value', 'BOFIP', 'crédit d\'impôt', 'régime fiscal'],
      comptable: ['comptabilité', 'bilan', 'cotisations', 'URSSAF', 'DSN', 'liasse fiscale', 'plan comptable', 'micro-entreprise'],
      juriste: ['contrat de travail', 'licenciement', 'prud\'hommes', 'RGPD', 'CNIL', 'propriété intellectuelle', 'bail', 'droit civil', 'responsabilité civile']
    }
  }
};

// Get ordered list of agents
function getAgentsList() {
  return ['fiscal', 'comptable', 'juriste', 'affaires'].map(id => AGENTS[id]);
}

// Get agent by ID
function getAgent(id) {
  return AGENTS[id] || null;
}

export { AGENTS, getAgentsList, getAgent };
