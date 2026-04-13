/* ================================================
   iaNanoLeads — Configuration NewsAPI
   Récupération actualités par secteur et pays
   ================================================ */

const NEWSAPI_KEY = process.env.NEWSAPI_KEY;
const NEWSAPI_BASE = 'https://newsapi.org/v2';

// Mots-clés par secteur
const SECTOR_KEYWORDS = {
  tech: 'technologie startup innovation numérique',
  finance: 'finance banque investissement fintech',
  retail: 'commerce retail e-commerce vente',
  healthcare: 'santé médical pharmacie clinique',
  'real-estate': 'immobilier promotion achat vente logement',
  hospitality: 'hôtel restauration tourisme hospitality',
  education: 'éducation formation école edtech',
  manufacturing: 'industrie fabrication production supply chain',
  consulting: 'conseil consulting management stratégie',
  marketing: 'marketing publicité communication digital',
  logistics: 'logistique transport supply chain livraison',
  construction: 'construction BTP immobilier travaux',
  agriculture: 'agriculture agroalimentaire exploitation',
  energy: 'énergie renouvelable électricité pétrole',
  insurance: 'assurance mutuelle prévoyance risque'
};

// Langues par pays
const COUNTRY_LANG_MAP = {
  FR: 'fr', BE: 'fr', CH: 'fr', LU: 'fr', SN: 'fr', CI: 'fr',
  CM: 'fr', CD: 'fr', ML: 'fr', BF: 'fr',
  DE: 'de', AT: 'de',
  ES: 'es', MX: 'es',
  GB: 'en', US: 'en', CA: 'en'
};

/**
 * Récupère les actualités pour un secteur et un pays donnés
 * @param {string} sector - Secteur d'activité
 * @param {string} country - Code pays ISO 2 lettres
 * @param {number} count - Nombre d'articles souhaités
 */
async function fetchSectorNews(sector, country = 'FR', count = 3) {
  if (!NEWSAPI_KEY) {
    return getFallbackNews(sector);
  }

  const keywords = SECTOR_KEYWORDS[sector] || sector;
  const lang = COUNTRY_LANG_MAP[country.toUpperCase()] || 'fr';

  try {
    const url = `${NEWSAPI_BASE}/everything?q=${encodeURIComponent(keywords)}&language=${lang}&sortBy=publishedAt&pageSize=${count}&apiKey=${NEWSAPI_KEY}`;
    const { default: fetch } = await import('node-fetch');
    const resp = await fetch(url);

    if (!resp.ok) {
      return getFallbackNews(sector);
    }

    const data = await resp.json();
    if (!data.articles || data.articles.length === 0) {
      return getFallbackNews(sector);
    }

    return data.articles.slice(0, count).map(a => ({
      title: a.title || '',
      description: a.description || '',
      source: a.source?.name || '',
      url: a.url || '',
      publishedAt: a.publishedAt || new Date().toISOString()
    }));
  } catch (err) {
    console.error('[NewsAPI] Erreur fetch:', err.message);
    return getFallbackNews(sector);
  }
}

// Articles de fallback si NewsAPI indisponible
function getFallbackNews(sector) {
  return [
    {
      title: `Tendances ${sector} 2025`,
      description: `Les entreprises du secteur ${sector} font face à de nouvelles opportunités de croissance sur les marchés européens et africains.`,
      source: 'W2K-Digital Intelligence',
      url: '',
      publishedAt: new Date().toISOString()
    }
  ];
}

module.exports = { fetchSectorNews };
