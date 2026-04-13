/* ================================================
   iaNanoLeads — API Actualités sectorielles
   Endpoint public pour récupérer les news
   ================================================ */

const express = require('express');
const router = express.Router();
const { fetchSectorNews } = require('../config/newsapi');

/**
 * GET /api/news/:sector
 * Actualités pour un secteur et pays donnés
 */
router.get('/:sector', async (req, res) => {
  try {
    const { sector } = req.params;
    const { country = 'FR', count = 5 } = req.query;

    const news = await fetchSectorNews(sector, country.toUpperCase(), Math.min(parseInt(count) || 5, 10));

    res.json({
      success: true,
      sector,
      country: country.toUpperCase(),
      count: news.length,
      articles: news
    });
  } catch (err) {
    console.error('[News] Erreur:', err.message);
    res.status(500).json({ error: 'Erreur récupération actualités' });
  }
});

module.exports = router;
