/* ================================================
   iaNanoLeads — Générateur d'emails personnalisés
   Templates par secteur + intégration actualités
   ================================================ */

const TEMPLATES = {
  tech: {
    subject: '🚀 {nom_entreprise} — Opportunité innovation {secteur}',
    body: `Bonjour {prénom},

J'espère que vous allez bien. En tant que responsable chez {nom_entreprise}, je pense que vous serez particulièrement intéressé(e) par les développements récents dans le secteur technologique.

{actualité_1}

C'est dans ce contexte que nous accompagnons des entreprises comme la vôtre à transformer ces tendances en opportunités concrètes.

En quelques mots, notre proposition de valeur :
→ Approche personnalisée pour le secteur {secteur}
→ Résultats mesurables dès les premières semaines
→ Support dédié tout au long du partenariat

Seriez-vous disponible pour un échange de 20 minutes cette semaine ou la suivante ?

Cordialement,
{expéditeur}`
  },

  finance: {
    subject: '💼 {nom_entreprise} — Solutions {secteur} adaptées à votre marché',
    body: `Bonjour {prénom},

Le secteur financier traverse une période de transformation accélérée. {actualité_1}

Face à ces évolutions, les entreprises qui s'adaptent rapidement prennent un avantage décisif.

Notre solution aide les acteurs de la finance à :
→ Identifier les opportunités de croissance en temps réel
→ Optimiser leur prospection commerciale
→ Développer leur portefeuille clients en {pays}

Je serais ravi(e) de vous présenter comment nous avons accompagné des entreprises similaires à {nom_entreprise}.

Disponible pour un échange cette semaine ?

Bien à vous,
{expéditeur}`
  },

  retail: {
    subject: '🛍️ Boostez la croissance de {nom_entreprise}',
    body: `Bonjour {prénom},

Le secteur du retail en {pays} connaît des mutations profondes. {actualité_1}

Les entreprises qui saisissent ces changements génèrent des croissances significatives.

Comment nous pouvons aider {nom_entreprise} :
→ Identifier vos clients B2B à fort potentiel
→ Automatiser votre prospection commerciale
→ Maximiser votre ROI sur chaque action commerciale

Je souhaiterais vous présenter des cas concrets de clients du secteur {secteur} qui ont multiplié leur pipeline par 3 en quelques semaines.

Quand êtes-vous disponible ?

Bien cordialement,
{expéditeur}`
  },

  healthcare: {
    subject: '🏥 {nom_entreprise} — Innovation dans la santé',
    body: `Bonjour {prénom},

Le secteur de la santé en {pays} fait face à des enjeux majeurs. {actualité_1}

Dans ce contexte, les acteurs qui disposent des bons outils de développement commercial prennent une longueur d'avance.

Notre approche pour les professionnels de santé :
→ Leads B2B qualifiés dans votre spécialité
→ Conformité RGPD garantie pour toutes les données
→ Personnalisation selon les réglementations locales

Serait-il possible d'échanger 20 minutes sur vos objectifs de développement ?

Cordialement,
{expéditeur}`
  },

  default: {
    subject: '✉️ Proposition de valeur pour {nom_entreprise}',
    body: `Bonjour {prénom},

J'espère que vous allez bien. {actualité_1}

Je me permets de vous contacter car {nom_entreprise} correspond exactement au profil d'entreprises avec qui nous créons de la valeur.

Notre proposition :
→ Solution adaptée au secteur {secteur}
→ Résultats mesurables et rapides
→ Accompagnement personnalisé en {pays}

Seriez-vous ouvert(e) à un court échange cette semaine ?

Bien cordialement,
{expéditeur}`
  }
};

/**
 * Génère un email personnalisé pour un lead
 * @param {object} lead - Données du lead
 * @param {Array} news - Articles d'actualité du secteur
 * @param {string} expéditeur - Nom de l'expéditeur
 */
function generateEmail(lead, news = [], expediteur = 'L\'équipe iaNanoLeads') {
  const sector = (lead.secteur || 'default').toLowerCase();
  const template = TEMPLATES[sector] || TEMPLATES.default;

  const actualite1 = news[0]
    ? `J'ai notamment noté : "${news[0].title}" (${news[0].source || 'source sectorielle'}), ce qui confirme l'importance de ce sujet pour votre activité.`
    : `Le secteur ${sector} est en pleine évolution, créant de nouvelles opportunités pour les entreprises proactives.`;

  const variables = {
    '{nom_entreprise}': lead.entreprise || 'votre entreprise',
    '{prénom}': lead.prenom || lead.nom?.split(' ')[0] || 'Monsieur/Madame',
    '{secteur}': lead.secteur || 'votre secteur',
    '{pays}': lead.pays || 'votre marché',
    '{actualité_1}': actualite1,
    '{expéditeur}': expediteur
  };

  let subject = template.subject;
  let body = template.body;

  for (const [key, val] of Object.entries(variables)) {
    const regex = new RegExp(key.replace(/[{}]/g, '\\$&'), 'g');
    subject = subject.replace(regex, val);
    body = body.replace(regex, val);
  }

  return { subject, body, lead };
}

/**
 * Génère des emails en masse pour une liste de leads
 */
function generateBulkEmails(leads, news = [], expediteur) {
  return leads.map(lead => generateEmail(lead, news, expediteur));
}

module.exports = { generateEmail, generateBulkEmails };
