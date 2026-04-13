/* ================================================
   iaNanoLeads — API Emails personnalisés
   Génération emails contextuels avec actualités
   ================================================ */

const express = require('express');
const router = express.Router();
const { fetchSectorNews } = require('../config/newsapi');
const { generateEmail, generateBulkEmails } = require('../utils/email-generator');
const { verifyLicense } = require('../utils/license');

// Middleware licence
async function checkLicense(req, res, next) {
  const fp = req.headers['x-fingerprint'] || req.body?.fingerprint;
  if (!fp) return res.status(401).json({ error: 'Fingerprint requis' });
  const result = await verifyLicense(fp);
  if (!result.valid) return res.status(403).json({ error: 'Licence invalide : ' + result.reason });
  req.license = result.license;
  next();
}

/**
 * POST /api/emails/generate
 * Génère des emails personnalisés pour une liste de leads
 */
router.post('/generate', checkLicense, async (req, res) => {
  try {
    const {
      leads = [],
      secteur = 'tech',
      pays = 'FR',
      expediteur = 'L\'équipe iaNanoLeads'
    } = req.body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ error: 'Tableau de leads requis' });
    }

    if (leads.length > 500) {
      return res.status(400).json({ error: 'Maximum 500 leads par requête' });
    }

    // Récupération actualités secteur
    const news = await fetchSectorNews(secteur, pays, 3);

    // Génération des emails
    const emails = generateBulkEmails(leads, news, expediteur);

    res.json({
      success: true,
      count: emails.length,
      secteur,
      news_articles: news.length,
      emails,
      message: `${emails.length} emails personnalisés générés`
    });
  } catch (err) {
    console.error('[Emails] Erreur:', err.message);
    res.status(500).json({ error: 'Erreur lors de la génération des emails' });
  }
});

/**
 * POST /api/emails/single
 * Génère un email pour un seul lead
 */
router.post('/single', checkLicense, async (req, res) => {
  try {
    const { lead, secteur, pays = 'FR', expediteur } = req.body;
    if (!lead) return res.status(400).json({ error: 'Lead requis' });

    const news = await fetchSectorNews(secteur || lead.secteur || 'tech', pays, 2);
    const email = generateEmail(lead, news, expediteur);

    res.json({ success: true, email, news_used: news.length });
  } catch (err) {
    res.status(500).json({ error: 'Erreur génération email' });
  }
});

/**
 * GET /api/emails/news/:sector
 * Récupère les actualités pour un secteur
 */
router.get('/news/:sector', async (req, res) => {
  try {
    const { sector } = req.params;
    const { country = 'FR', count = 5 } = req.query;
    const news = await fetchSectorNews(sector, country, parseInt(count) || 5);
    res.json({ success: true, sector, articles: news });
  } catch (err) {
    res.status(500).json({ error: 'Erreur récupération actualités' });
  }
});

module.exports = router;
