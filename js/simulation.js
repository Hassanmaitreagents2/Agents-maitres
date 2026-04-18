/* ============================================================
   AGENTS MAÎTRES — Simulation Engine
   Contextualized demo responses for all 4 agents
   ============================================================ */

import { detectRedirect, getRedirectMessage } from './router.js';

// ============================================================
// FISCAL AGENT RESPONSES
// ============================================================
const FISCAL_RESPONSES = [
  {
    keywords: ['plus-value', 'plus value', 'immobilière', 'immobilier', 'vente'],
    response: `**Régime des plus-values immobilières des particuliers**

Conformément à l'**article 150 U du CGI**, les plus-values réalisées lors de la cession à titre onéreux de biens immobiliers sont soumises à l'impôt sur le revenu au taux forfaitaire de **19%**, auquel s'ajoutent les **prélèvements sociaux de 17,2%**, soit un taux global de **36,2%**.

**Abattements pour durée de détention** (art. 150 VC du CGI) :

| Durée de détention | Abattement IR | Abattement PS |
|---|---|---|
| Jusqu'à 5 ans | 0% | 0% |
| De 6 à 21 ans | 6% par an | 1,65% par an |
| 22ème année | 4% | 1,60% |
| Au-delà de 22 ans | Exonération IR | 9% par an |
| Au-delà de 30 ans | Exonération IR | Exonération PS |

**Exonérations notables :**
- **Résidence principale** : exonération totale (art. 150 U-II-1° du CGI)
- **Première cession** d'un logement autre que la résidence principale, sous conditions (art. 150 U-II-1°bis)
- Cessions inférieures à **15 000 €** (art. 150 U-II-6°)

⚠️ *La surtaxe sur les plus-values supérieures à 50 000 € (art. 1609 nonies G du CGI) peut s'appliquer, avec des taux allant de 2% à 6%.*

📅 *Dernière vérification : barèmes 2025, susceptibles d'évoluer. Consultez le BOFIP BOI-RFPI-PVI pour les mises à jour.*`,
    sources: ['Art. 150 U CGI', 'Art. 150 VC CGI', 'BOFIP BOI-RFPI-PVI']
  },
  {
    keywords: ['micro', 'bnc', 'micro-bnc', 'libéral'],
    response: `**Régime micro-BNC — Synthèse juridique**

Le régime micro-BNC est défini aux **articles 102 ter et suivants du CGI**.

**Conditions d'éligibilité :**
- Recettes annuelles HT ≤ **77 700 €** (seuil 2024, art. 102 ter du CGI)
- Applicable aux titulaires de bénéfices non commerciaux (professions libérales, etc.)

**Fonctionnement :**
- Abattement forfaitaire de **34%** sur les recettes (minimum 305 €)
- Le bénéfice imposable = 66% des recettes
- Pas d'obligation de bilan ni de compte de résultat
- Déclaration simplifiée (2042-C PRO)

**Option pour le régime réel :**
Possibilité d'opter pour la déclaration contrôlée (2035) si les charges réelles dépassent 34% des recettes. L'option est valable 1 an, reconduite tacitement (art. 102 ter-5 du CGI).

**Franchise en base de TVA** (art. 293 B du CGI) :
- Applicable si CA < 36 800 € (seuil de base 2024)
- Seuil majoré : 39 100 €

💡 *Piste d'optimisation : si vos charges réelles dépassent 34% de vos recettes, le régime réel peut être plus avantageux. Je vous recommande de faire une simulation comparative.*`,
    sources: ['Art. 102 ter CGI', 'Art. 293 B CGI', 'BOFIP BOI-BNC-DECLA-10']
  },
  {
    keywords: ['cir', 'crédit', 'recherche', 'innovation'],
    response: `**Crédit d'Impôt Recherche (CIR) — art. 244 quater B du CGI**

Le CIR est un dispositif fiscal de soutien aux activités de R&D, codifié à l'**article 244 quater B du CGI**.

**Taux applicable :**
- **30%** des dépenses de R&D jusqu'à 100 M€
- **5%** au-delà de 100 M€

**Dépenses éligibles** (art. 244 quater B-II) :
1. Dotations aux amortissements des immobilisations affectées à la R&D
2. Dépenses de personnel (chercheurs et techniciens de recherche)
3. Dépenses de fonctionnement (forfait de 43% des dépenses de personnel)
4. Brevets et certificats d'obtention végétale
5. Sous-traitance (organismes agréés)

**Conditions :**
- Les activités doivent comporter des opérations de recherche fondamentale, appliquée ou de développement expérimental
- Critères stricts de nouveauté ou d'amélioration substantielle

⚠️ *Le rescrit fiscal (art. L80 B-3° du LPF) permet de sécuriser l'éligibilité au CIR auprès de l'administration. Fortement recommandé.*

📅 *Dernière mise à jour : BOFIP BOI-BIC-RICI-10-10, vérifié en 2025.*`,
    sources: ['Art. 244 quater B CGI', 'Art. L80 B LPF', 'BOFIP BOI-BIC-RICI-10-10']
  },
  {
    keywords: ['prescription', 'délai', 'contrôle', 'vérification'],
    response: `**Délais de prescription fiscale**

Les délais de prescription sont régis par le **Livre des Procédures Fiscales (LPF)**.

**Droit commun — art. L169 et L176 du LPF :**

| Impôt | Délai | Base légale |
|---|---|---|
| IR et IS | 3 ans (N + 3) | Art. L169 LPF |
| TVA | 3 ans | Art. L176 LPF |
| Droits d'enregistrement | 3 ans (6 ans si omission) | Art. L180, L186 LPF |
| IFI | 3 ans (6 ans si omission) | Art. L180 LPF |
| Taxes locales | 3 ans | Art. L174 LPF |

**Délais dérogatoires :**
- **10 ans** en cas d'activités occultes (art. L169-2° LPF)
- **10 ans** pour les avoirs à l'étranger non déclarés (art. L169-5° LPF)
- **6 ans** si omission de déclaration (art. L169-1° LPF)

**Points de vigilance :**
- Le délai court à compter du 1er janvier suivant l'année d'imposition
- Les actes interruptifs (demande de renseignements, mise en demeure, proposition de rectification) interrompent la prescription
- La réclamation du contribuable doit être déposée dans le délai de réclamation (art. R*196-1 LPF)

⚠️ *La prescription est un mécanisme technique. Pour une analyse de votre situation personnelle, un accompagnement professionnel est recommandé.*`,
    sources: ['Art. L169 LPF', 'Art. L176 LPF', 'Art. L186 LPF', 'Art. R*196-1 LPF']
  }
];

// ============================================================
// COMPTABLE AGENT RESPONSES
// ============================================================
const COMPTABLE_RESPONSES = [
  {
    keywords: ['simuler', 'simulation', 'micro-entreprise', 'micro entreprise', 'auto-entrepreneur', 'autoentrepreneur', 'cotisation'],
    response: `**Simulation micro-entreprise — Activité de prestations de services (BNC)**

Voici une simulation basée sur les **barèmes URSSAF en vigueur (2025)** :

**Hypothèses retenues :**
- Statut : Micro-entrepreneur
- Activité : Prestations de services BNC
- Chiffre d'affaires annuel : **50 000 €**
- Option : Versement libératoire de l'IR non retenu
- Situation : Célibataire, 1 part fiscale

**Résultat de la simulation :**

| Poste | Montant |
|---|---|
| Chiffre d'affaires brut | 50 000 € |
| Cotisations sociales (21,1%) | - 10 550 € |
| CFP (0,2%) | - 100 € |
| Taxe pour frais de chambre | - 0 € (libéral) |
| **Revenu après cotisations** | **39 350 €** |
| Abattement forfaitaire IR (34%) | 17 000 € |
| Revenu imposable | 33 000 € |
| IR estimé (barème progressif) | ~ 3 852 € |
| **Revenu net estimé** | **≈ 35 498 €** |

**Sources des taux :**
- Cotisations sociales : [urssaf.fr/portail/home/micro-entrepreneur](https://www.urssaf.fr/) — taux BNC 2025
- Barème IR 2025 : art. 197 du CGI

⚠️ *Cette estimation est indicative. Les montants réels peuvent varier selon votre situation personnelle (nombre de parts, autres revenus, etc.). Simulateur officiel : [autoentrepreneur.urssaf.fr](https://www.autoentrepreneur.urssaf.fr/)*

💡 *Si votre CA dépasse 36 800 €, vous êtes redevable de la TVA. Intégrez-la dans votre stratégie tarifaire.*`,
    sources: ['Art. 102 ter CGI', 'Art. 197 CGI', 'URSSAF — barèmes 2025']
  },
  {
    keywords: ['échéance', 'déclaration', 'sarl', 'obligation', 'déclarative'],
    response: `**Obligations déclaratives d'une SARL — Calendrier annuel**

Voici le récapitulatif des principales échéances pour une SARL à l'IS (exercice calendaire) :

**Déclarations fiscales :**

| Obligation | Échéance | Formulaire |
|---|---|---|
| Déclaration de résultats (IS) | 2ème jour ouvré suivant le 1er mai (N+1) | 2065 + liasses 2050-2059 |
| Paiement solde IS | 15 mai (N+1) | Relevé de solde 2572 |
| Acomptes IS | 15/03, 15/06, 15/09, 15/12 | 2571 |
| TVA mensuelle | 15-24 du mois suivant | CA3 |
| TVA trimestrielle | Mois suivant le trimestre | CA3 |
| CVAE (si CA > 500K€) | 2ème jour ouvré suivant le 1er mai | 1330 |
| CFE | 15 décembre | Avis d'imposition |

**Déclarations sociales :**

| Obligation | Échéance | Support |
|---|---|---|
| DSN (mensuelle) | 5 ou 15 du mois suivant | Net-entreprises.fr |
| Gérant majoritaire TNS | Cotisations URSSAF trimestrielles ou mensuelles | URSSAF.fr |

**Obligations juridiques :**

| Obligation | Délai | Source |
|---|---|---|
| Approbation des comptes (AGO) | 6 mois après clôture | Art. L223-26 C. com. |
| Dépôt des comptes au greffe | 1 mois après AGO (2 mois si en ligne) | Art. L232-22 C. com. |

📅 *Calendrier basé sur un exercice clos au 31/12. Adaptez les dates si votre exercice diffère.*`,
    sources: ['Art. L223-26 C. com.', 'Art. L232-22 C. com.', 'CGI art. 223', 'URSSAF']
  },
  {
    keywords: ['immobilisation', 'amortissement', 'comptabiliser', 'comptabilisation'],
    response: `**Comptabilisation d'une immobilisation amortissable**

Conformément au **PCG (règlement ANC 2014-03)** et aux **art. 214-1 et suivants** :

**1. Enregistrement à l'acquisition :**
\`\`\`
Débit : 2xxx — Immobilisation (coût d'acquisition HT)
Débit : 44562 — TVA sur immobilisations
Crédit : 404 — Fournisseur d'immobilisations
\`\`\`

**Le coût d'acquisition comprend** (PCG art. 213-8) :
- Prix d'achat net (après remises)
- Droits de douane et taxes non récupérables
- Coûts directement attribuables à la mise en état d'utilisation

**2. Amortissement (PCG art. 214-4) :**
\`\`\`
Débit : 681x — Dotations aux amortissements
Crédit : 28xx — Amortissements des immobilisations
\`\`\`

**Durées indicatives (usages fiscaux, CGI art. 39-1-2°) :**

| Immobilisation | Durée | Taux linéaire |
|---|---|---|
| Constructions | 20-50 ans | 2% à 5% |
| Matériel industriel | 5-10 ans | 10% à 20% |
| Matériel de transport | 4-5 ans | 20% à 25% |
| Mobilier de bureau | 10 ans | 10% |
| Matériel informatique | 3 ans | 33,33% |

**Modes d'amortissement :**
- **Linéaire** : obligatoire pour les biens neufs en comptabilité
- **Dégressif** : optionnel pour certains biens (art. 39 A du CGI), coefficient selon durée
- **Par composants** : obligatoire si composants significatifs (PCG art. 214-9)

💡 *Pensez à vérifier l'éligibilité à l'amortissement dégressif pour optimiser la charge déductible les premières années.*`,
    sources: ['PCG art. 213-8', 'PCG art. 214-4', 'CGI art. 39-1-2°', 'CGI art. 39 A']
  },
  {
    keywords: ['trésorerie', 'engagement', 'différence', 'comptabilité de'],
    response: `**Comptabilité de trésorerie vs comptabilité d'engagement**

La distinction est fondamentale et encadrée par le **PCG (règlement ANC 2014-03)** :

**Comptabilité d'engagement** (PCG art. 512-1) :
- Enregistrement des opérations dès la **naissance du droit ou de l'obligation** (émission de la facture)
- Principe de la **séparation des exercices** : rattachement des charges et produits à l'exercice concerné
- **Obligatoire** pour : sociétés commerciales (SA, SAS, SARL), associations dépassant certains seuils

**Comptabilité de trésorerie** (tolérance fiscale) :
- Enregistrement uniquement lors de l'**encaissement ou du décaissement**
- En fin d'exercice : régularisation via les créances et dettes
- **Admise** pour : professions libérales BNC (art. 93 CGI), micro-entrepreneurs, certaines associations

| Critère | Engagement | Trésorerie |
|---|---|---|
| Fait générateur | Facture | Paiement |
| Complexité | Plus élevée | Simplifiée |
| Statuts concernés | SA, SAS, SARL | BNC, micro, petites assoc. |
| Régularisation fin d'exercice | Non | Oui (créances/dettes) |
| Suivi des clients/fournisseurs | Permanent | En fin d'exercice |

⚠️ *Même en comptabilité de trésorerie, les régularisations de fin d'exercice sont obligatoires pour présenter un résultat fidèle (principe d'image fidèle, PCG art. 121-1).*`,
    sources: ['PCG art. 512-1', 'PCG art. 121-1', 'CGI art. 93']
  }
];

// ============================================================
// JURISTE AGENT RESPONSES
// ============================================================
const JURISTE_RESPONSES = [
  {
    keywords: ['préavis', 'démission', 'délai', 'rupture'],
    response: `**Délais de préavis en cas de démission — Droit du travail français**

La démission est un droit du salarié, encadré par le **Code du travail** :

**Principe (art. L1237-1 C. trav.) :**
La démission résulte d'une volonté claire et non équivoque du salarié de rompre son contrat. Elle n'a pas besoin d'être motivée.

**Durée du préavis :**
Le Code du travail ne fixe **pas de durée légale uniforme** pour le préavis de démission. Celui-ci est déterminé par :

1. **La convention collective applicable** (source principale)
2. **Les usages de la profession**
3. **Le contrat de travail** (s'il prévoit un préavis plus favorable)

**Durées indicatives selon les conventions :**

| Catégorie | Durée courante |
|---|---|
| Ouvriers / Employés | 1 à 2 semaines |
| ETAM (Techniciens) | 1 à 2 mois |
| Cadres | 3 mois |

**Dispense de préavis :**
- L'employeur peut dispenser le salarié d'effectuer le préavis : dans ce cas, l'indemnité compensatrice de préavis est due (art. L1234-5 C. trav.)
- La dispense à la demande du salarié est soumise à l'accord de l'employeur

**Cas de dispense totale de préavis :**
- Démission pendant la grossesse (art. L1225-34 C. trav.)
- Démission pendant le congé pour création d'entreprise (art. L3142-109 C. trav.)
- Démission en fin de congé parental (sous conditions)

⚠️ *Il est impératif de vérifier votre convention collective applicable pour connaître la durée exacte. La Cour de cassation sanctionne le non-respect du préavis par des dommages-intérêts (Cass. soc., 18 juin 2008, n°07-42.161).*`,
    sources: ['Art. L1237-1 C. trav.', 'Art. L1234-5 C. trav.', 'Art. L1225-34 C. trav.']
  },
  {
    keywords: ['RGPD', 'données personnelles', 'CNIL', 'protection', 'PME'],
    response: `**Obligations RGPD pour une PME — Synthèse pratique**

Le **Règlement (UE) 2016/679 (RGPD)** est applicable depuis le 25 mai 2018 et s'impose à toute entreprise traitant des données personnelles. La **loi Informatique et Libertés** (loi n°78-17 modifiée) complète le dispositif en France.

**Obligations principales :**

**1. Registre des traitements** (art. 30 RGPD)
- Obligatoire pour les entreprises de + de 250 salariés
- Recommandé pour toutes les PME (et obligatoire si traitements réguliers ou données sensibles)

**2. Information des personnes** (art. 13 et 14 RGPD)
- Mention d'information sur chaque formulaire de collecte
- Politique de confidentialité accessible

**3. Base légale** (art. 6 RGPD)
- Chaque traitement doit reposer sur une base légale : consentement, contrat, obligation légale, intérêt légitime...

**4. Droits des personnes** (art. 15 à 22 RGPD)
- Accès, rectification, effacement, portabilité, opposition, limitation
- Délai de réponse : **1 mois** (prolongeable à 3 mois si complexité)

**5. Sécurité** (art. 32 RGPD)
- Mesures techniques et organisationnelles appropriées
- Chiffrement, pseudonymisation, sauvegardes, contrôle d'accès

**6. DPO** (art. 37 RGPD)
- Obligatoire pour les organismes publics et certains traitements à grande échelle
- Facultatif mais recommandé pour les PME

**Sanctions CNIL :**
- Jusqu'à **20 millions d'euros** ou **4% du CA mondial** (art. 83 RGPD)
- Mises en demeure, avertissements, injonctions également possibles

💡 *La CNIL propose un guide PME gratuit et un outil de registre en ligne : [cnil.fr/fr/rgpd-par-ou-commencer](https://www.cnil.fr/fr/rgpd-par-ou-commencer)*`,
    sources: ['RGPD art. 6, 13, 30, 32, 37', 'Loi n°78-17 modifiée', 'CNIL — Guide PME']
  },
  {
    keywords: ['marque', 'protéger', 'propriété intellectuelle', 'INPI', 'brevet'],
    response: `**Protection d'une marque en France**

Le droit des marques est régi par le **Code de la propriété intellectuelle (CPI), articles L711-1 et suivants**.

**Conditions de validité** (art. L711-1 CPI) :
- **Distinctivité** : la marque doit distinguer les produits/services
- **Licéité** : pas contraire à l'ordre public
- **Disponibilité** : pas de marque antérieure identique/similaire pour des produits/services similaires

**Procédure de dépôt :**

| Étape | Détail |
|---|---|
| Recherche d'antériorité | INPI, base Marques (gratuite) |
| Dépôt | En ligne sur [inpi.fr](https://www.inpi.fr/) |
| Coût | 190 € (1 classe), +40 € par classe supplémentaire |
| Publication au BOPI | 6 semaines après dépôt |
| Période d'opposition | 2 mois après publication |
| Enregistrement | ~5 mois si pas d'opposition |

**Durée de protection** (art. L712-1 CPI) :
- **10 ans** à compter du dépôt
- **Renouvelable indéfiniment** par périodes de 10 ans

**Étendue territoriale :**
- Marque française (INPI) : protection en France uniquement
- Marque de l'UE (EUIPO) : protection dans les 27 États membres
- Marque internationale (OMPI) : extension pays par pays

⚠️ *Avant tout dépôt, une recherche d'antériorité approfondie (identiques + similaires) est vivement recommandée pour éviter une opposition ou une action en contrefaçon (art. L716-4-6 CPI).*`,
    sources: ['Art. L711-1 CPI', 'Art. L712-1 CPI', 'Art. L716-4-6 CPI']
  },
  {
    keywords: ['contrat', 'validité', 'condition', 'formation', 'consentement'],
    response: `**Conditions de validité d'un contrat — Droit civil français**

Depuis la réforme du droit des contrats (**Ordonnance n° 2016-131 du 10 février 2016**, ratifiée par la loi du 20 avril 2018), les conditions sont codifiées aux **articles 1128 et suivants du Code civil**.

**Les 3 conditions essentielles** (art. 1128 C. civ.) :

**1. Le consentement des parties**
- Doit être libre et éclairé
- Vices du consentement (art. 1130 C. civ.) : **erreur**, **dol**, **violence**
- L'erreur doit porter sur les qualités essentielles (art. 1132)
- Le dol inclut la réticence dolosive (art. 1137)

**2. La capacité de contracter**
- Mineurs non émancipés : incapacité de principe (art. 1146)
- Majeurs protégés : selon la mesure (tutelle, curatelle)

**3. Un contenu licite et certain**
- L'objet de l'obligation doit être déterminé ou déterminable (art. 1163)
- Le contrat ne peut déroger à l'ordre public (art. 1162)

**Sanctions :**
- **Nullité relative** : vice du consentement, incapacité (prescription 5 ans, art. 1152)
- **Nullité absolue** : contenu illicite, atteinte à l'ordre public

**Form libre** (art. 1172 C. civ.) :
Le contrat est en principe consensuel (pas de forme imposée), sauf exceptions légales (vente immobilière, contrat de mariage, etc.).

💡 *La phase précontractuelle est désormais encadrée par les articles 1112 à 1112-2 C. civ. (devoir d'information, bonne foi). Une rupture abusive des négociations peut engager la responsabilité extracontractuelle.*`,
    sources: ['Art. 1128 C. civ.', 'Art. 1130 C. civ.', 'Art. 1163 C. civ.', 'Ord. 2016-131']
  }
];

// ============================================================
// AFFAIRES AGENT RESPONSES
// ============================================================
const AFFAIRES_RESPONSES = [
  {
    keywords: ['SAS', 'SARL', 'comparaison', 'différence', 'versus', 'vs', 'choisir'],
    response: `**SAS vs SARL — Comparaison juridique approfondie**

Les deux formes sociales les plus utilisées en France, régies par le **Code de commerce** :

| Critère | **SARL** | **SAS** |
|---|---|---|
| **Textes** | Art. L223-1 et s. C. com. | Art. L227-1 et s. C. com. |
| **Associés** | 1 à 100 | 1 à illimité |
| **Capital minimum** | 1 € | 1 € |
| **Direction** | Gérant (personne physique) | Président (personne physique ou morale) |
| **Liberté statutaire** | Encadrée par la loi | **Très grande liberté** |
| **Cession de parts** | Agrément obligatoire (art. L223-14) | Libre (sauf clause statutaire) |
| **Charges sociales du dirigeant** | TNS si gérant majoritaire (~45%) | Assimilé salarié (~65-82%) |
| **Conjoint** | Statut de conjoint collaborateur possible | Non applicable |
| **Entrée en bourse** | Impossible | Possible |
| **Commissaire aux comptes** | Seuils | Seuils |

**Points stratégiques :**

🔹 **SARL** : privilégiée pour les projets familiaux, les petites structures où le coût social du dirigeant est un critère clé (régime TNS moins coûteux).

🔹 **SAS** : plébiscitée pour les startups, les levées de fonds, et les structures nécessitant une **grande souplesse** dans l'organisation du pouvoir (actions de préférence, clauses de sortie, etc.).

⚠️ *Le choix entre SAS et SARL doit intégrer la stratégie globale : rémunération du dirigeant, protection sociale, perspectives de croissance, entrée d'investisseurs. Pour les aspects chiffrés (coût social comparatif), je vous recommande de consulter notre **Expert Comptable**.*`,
    sources: ['Art. L223-1 C. com.', 'Art. L227-1 C. com.', 'Art. L223-14 C. com.']
  },
  {
    keywords: ['BODACC', 'publicité', 'annonce', 'publication', 'obligation'],
    response: `**Obligations de publicité au BODACC**

Le **Bulletin Officiel des Annonces Civiles et Commerciales (BODACC)** est régi par les **articles R123-209 et suivants du Code de commerce** et le **décret n°2012-928**.

**Événements nécessitant une publication au BODACC :**

| Événement | Délai | Base légale |
|---|---|---|
| Création d'entreprise | Après immatriculation au RCS | Art. R123-155 C. com. |
| Modification (siège, objet, dirigeant) | Après inscription modificative | Art. R123-209 C. com. |
| Cession de fonds de commerce | Insertion obligatoire | Art. L141-12 C. com. |
| Dissolution / Liquidation | Après inscription | Art. R123-209 C. com. |
| Radiation | Automatique | Art. R123-209 C. com. |
| Procédures collectives | Jugement d'ouverture | Art. R621-8 C. com. |
| Dépôt des comptes | Mention au BODACC | Art. L232-22 C. com. |

**Procédure :**
1. Formalité au greffe du tribunal de commerce
2. Le greffier transmet l'avis au BODACC
3. Publication dans les 8 jours suivant la réception par la DILA

**Sanctions en cas de non-respect :**
- Inopposabilité aux tiers des actes non publiés
- Risque de mise en cause de la responsabilité du dirigeant

💡 *Consultez gratuitement les annonces publiées sur [bodacc.fr](https://www.bodacc.fr/). Pour les cessions de fonds de commerce, une publication dans un JAL (Journal d'Annonces Légales) est également requise en parallèle.*`,
    sources: ['Art. R123-209 C. com.', 'Art. L141-12 C. com.', 'Art. L232-22 C. com.']
  },
  {
    keywords: ['pacte', 'associé', 'rédiger', 'clause'],
    response: `**Pacte d'associés — Guide juridique**

Le pacte d'associés (ou pacte d'actionnaires) est un contrat **extrastatutaire** régi par le **droit commun des contrats (art. 1101 et s. C. civ.)** et encadré par la jurisprudence commerciale.

**Différence avec les statuts :**

| Critère | Statuts | Pacte d'associés |
|---|---|---|
| Publicité | Public (greffe) | **Confidentiel** |
| Opposabilité | Erga omnes | Entre signataires uniquement |
| Modification | AGE (majorité qualifiée) | Unanimité des signataires |
| Sanction violation | Nullité de l'acte | Dommages-intérêts |

**Clauses essentielles à prévoir :**

**1. Clauses de sortie :**
- **Droit de préemption** : priorité d'achat aux associés existants
- **Clause de sortie conjointe** (tag-along) : droit de céder aux mêmes conditions
- **Clause d'entraînement** (drag-along) : obligation de céder ensemble
- **Clause de buy or sell** (clause texane)

**2. Clauses de gouvernance :**
- Droit de veto sur certaines décisions stratégiques
- Comité stratégique, droit d'information renforcé

**3. Clauses de non-concurrence et d'exclusivité**
- Limitée dans le temps, l'espace et l'activité (jurisprudence constante)

**4. Clause de valorisation**
- Méthode de calcul du prix en cas de cession (formule, expert désigné)

⚠️ *La Cour de cassation (Com., 11 mars 2014, n°12-27.832) a confirmé que la sanction de la violation d'un pacte est en principe l'allocation de dommages-intérêts, non l'annulation de la vente. Rédigez des clauses précises avec des pénalités contractuelles.*`,
    sources: ['Art. 1101 C. civ.', 'Cass. com. 11/03/2014, n°12-27.832', 'Art. L228-11 C. com.']
  },
  {
    keywords: ['cession', 'parts', 'sociales', 'formalités', 'transfert'],
    response: `**Cession de parts sociales de SARL — Formalités**

La cession de parts sociales de SARL est encadrée par les **articles L223-12 à L223-16 du Code de commerce**.

**Étape 1 — Agrément** (art. L223-14 C. com.) :
- **Obligatoire** pour les cessions à des tiers étrangers à la société
- Notification du projet à la société et à chaque associé (LRAR ou acte d'huissier)
- Décision de la collectivité des associés : **majorité d'au moins la moitié des parts sociales**
- Délai de réponse : **3 mois** (silence = agrément)

**Libre entre associés** et envers conjoints, ascendants, descendants (sauf clause contraire des statuts).

**Étape 2 — Acte de cession :**
- Acte sous seing privé ou acte notarié
- Mentions obligatoires : identité des parties, nombre de parts, prix, agrément obtenu

**Étape 3 — Enregistrement fiscal :**
- Déclaration aux impôts dans le mois
- **Droits d'enregistrement : 3%** (après abattement de 23 000 € x quote-part cédée) — art. 726-I-2° CGI

**Étape 4 — Opposabilité :**
- À la société : **signification par huissier** ou **acceptation dans un acte authentique** (art. 1690 C. civ.) — ou dépôt d'un original au siège
- Aux tiers : **dépôt au greffe** d'un exemplaire modifié des statuts

**Étape 5 — Modification des statuts :**
- Mise à jour de la répartition des parts
- Dépôt au greffe + publication au BODACC

⚠️ *Le non-respect de la procédure d'agrément rend la cession **inopposable à la société** (Cass. com., 21 janvier 2014, n°12-29.475). Soyez rigoureux sur les formalités.*`,
    sources: ['Art. L223-14 C. com.', 'Art. 726-I CGI', 'Art. 1690 C. civ.']
  }
];

// ============================================================
// GENERIC RESPONSES (fallback)
// ============================================================
const GENERIC_RESPONSES = {
  fiscal: [
    `Votre question est intéressante et relève bien du droit fiscal. Pour vous apporter une réponse précise et sourcée, permettez-moi de la reformuler :\n\n**Éléments de contexte nécessaires :**\n- Quel est votre statut (particulier, entrepreneur individuel, société) ?\n- Quel type d'impôt est concerné (IR, IS, TVA, droits d'enregistrement) ?\n- S'agit-il d'une question d'optimisation, de contentieux, ou de conformité ?\n\nAvec ces précisions, je pourrai vous citer les articles du CGI et du BOFIP applicables à votre situation.\n\n⚠️ *Rappel : ne partagez pas de données personnelles sensibles (numéro fiscal, etc.) dans cette interface.*`,
    `Je prends note de votre question fiscale. Pour y répondre avec la rigueur qui s'impose, je vais m'appuyer sur le **Code Général des Impôts** et la doctrine administrative (BOFIP).\n\nEn l'état actuel des textes :\n\n**Principes généraux applicables :**\n- Toute opération générant un revenu ou un gain est en principe imposable, sauf exonération expresse\n- Les textes d'exonération sont d'interprétation stricte (principe rappelé par le Conseil d'État)\n- Le contribuable a l'obligation de souscrire ses déclarations dans les délais légaux\n\nPourriez-vous préciser votre situation afin que je vous oriente vers les textes les plus pertinents ?`
  ],
  comptable: [
    `Bonne question ! En tant qu'expert-comptable, je m'appuie sur le **Plan Comptable Général (PCG)** et les règlements de l'ANC pour vous répondre.\n\nPour vous fournir une réponse adaptée, j'aurais besoin de quelques précisions :\n- Quel est votre **statut juridique** (micro-entreprise, SARL, SAS, EI, SCI, association) ?\n- Quel est votre **régime fiscal** (IR, IS, micro) ?\n- La question concerne-t-elle la comptabilité courante, les déclarations fiscales, ou les cotisations sociales ?\n\n💡 *N'hésitez pas à me demander une simulation chiffrée si vous souhaitez estimer vos charges, cotisations ou résultat net.*`,
    `Je note votre question comptable. Voici les principes fondamentaux qui s'appliquent :\n\n**Cadre réglementaire :**\n- Le PCG (règlement ANC 2014-03) définit les règles de comptabilisation\n- Le Code de commerce (art. L123-12 et s.) impose la tenue d'une comptabilité régulière\n- Les obligations déclaratives varient selon le statut et le régime fiscal\n\nPourriez-vous me donner plus de détails sur votre situation ? Je pourrai ainsi vous orienter précisément, avec les bonnes références.`
  ],
  juriste: [
    `Votre question relève effectivement du droit. Permettez-moi de l'examiner sous l'angle des textes en vigueur.\n\nPour vous fournir une analyse précise, j'aurais besoin de savoir :\n- Dans quel **domaine juridique** se situe votre question (civil, travail, PI, administratif) ?\n- S'agit-il d'une situation **préventive** (vous souhaitez vous prémunir) ou d'un **litige en cours** ?\n- Y a-t-il un **contrat ou un document** à analyser ?\n\nJe citerai systématiquement les articles de loi et la jurisprudence pertinente.\n\n⚠️ *Pour les cas complexes nécessitant un avis personnalisé, il est recommandé de consulter un avocat.*`,
    `Bonne question juridique. Voici mon analyse préliminaire :\n\n**Cadre général :**\nLe droit français repose sur une hiérarchie des normes (Constitution → lois → règlements → jurisprudence). Pour chaque problématique, je vérifierai :\n\n1. Les **textes législatifs** applicables (Codes)\n2. La **jurisprudence** récente (Cour de cassation, Conseil d'État)\n3. Les **doctrines administratives** éventuelles\n\nPourriez-vous préciser votre situation ? Je pourrai ainsi vous orienter vers les articles et décisions pertinentes.`
  ],
  affaires: [
    `Votre question relève du droit des affaires. Je vais l'examiner au regard du **Code de commerce** et de la réglementation applicable.\n\nPour vous répondre avec précision :\n- Quelle est la **forme sociale** concernée (SAS, SARL, SA, SCI, SNC) ?\n- S'agit-il d'une question de **création**, de **gestion courante**, ou d'une **opération exceptionnelle** (cession, fusion, transformation) ?\n- Y a-t-il des **contraintes réglementaires** spécifiques (secteur réglementé, AMF) ?\n\nJe citerai les articles du Code de commerce, les formalités au greffe et les obligations de publicité applicables.`,
    `Je prends note de votre question de droit des affaires. Voici les principes directeurs :\n\n**Cadre applicable :**\n- Le **Code de commerce** régit les sociétés commerciales et les actes de commerce\n- Les **statuts** constituent la loi des associés (art. 1836 C. civ.)\n- Les **formalités de publicité** (RCS, BODACC, JAL) conditionnent l'opposabilité aux tiers\n\nPourriez-vous me donner plus de contexte ? Je pourrai ainsi préciser les obligations légales, les délais et les sanctions éventuelles.`
  ]
};

// ============================================================
// RESPONSE ENGINE
// ============================================================

// Find the best matching response for a message
function findResponse(agentId, userMessage) {
  const responseSets = {
    fiscal: FISCAL_RESPONSES,
    comptable: COMPTABLE_RESPONSES,
    juriste: JURISTE_RESPONSES,
    affaires: AFFAIRES_RESPONSES
  };

  const responses = responseSets[agentId] || [];
  const messageLower = userMessage.toLowerCase();

  let bestMatch = null;
  let bestScore = 0;

  for (const entry of responses) {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (messageLower.includes(keyword.toLowerCase())) {
        score += keyword.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  return bestMatch;
}

// Generate a simulated response
function generateResponse(agentId, userMessage) {
  return new Promise((resolve) => {
    // Simulate thinking delay
    const delay = 1200 + Math.random() * 1500;

    setTimeout(() => {
      // Check for inter-agent redirect
      const redirect = detectRedirect(agentId, userMessage);

      // Find matching response
      const match = findResponse(agentId, userMessage);

      if (match) {
        const result = {
          content: match.response,
          sources: match.sources || []
        };

        // If redirect detected, append transfer suggestion
        if (redirect) {
          result.content += '\n\n---\n\n' + getRedirectMessage(agentId, redirect);
          result.transfer = {
            targetAgentId: redirect.targetAgentId,
            targetAgentName: redirect.targetAgent.name,
            targetAgentTitle: redirect.targetAgent.title
          };
        }

        resolve(result);
      } else {
        // Use generic fallback
        const generics = GENERIC_RESPONSES[agentId] || GENERIC_RESPONSES.fiscal;
        const fallback = generics[Math.floor(Math.random() * generics.length)];

        const result = {
          content: fallback,
          sources: []
        };

        if (redirect) {
          result.content += '\n\n---\n\n' + getRedirectMessage(agentId, redirect);
          result.transfer = {
            targetAgentId: redirect.targetAgentId,
            targetAgentName: redirect.targetAgent.name,
            targetAgentTitle: redirect.targetAgent.title
          };
        }

        resolve(result);
      }
    }, delay);
  });
}

export { generateResponse };
