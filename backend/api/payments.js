/* ================================================
   iaNanoLeads — API Paiements FineoPay
   Structure prête pour intégration webhooks
   ================================================ */

const express = require('express');
const router = express.Router();
const { insert } = require('../config/supabase');

// Prix en différentes devises
const PRICES = {
  EUR: { amount: 49, symbol: '€', label: '49€' },
  USD: { amount: 53, symbol: '$', label: '$53' },
  GBP: { amount: 42, symbol: '£', label: '£42' },
  CHF: { amount: 47, symbol: 'CHF', label: 'CHF 47' },
  FCFA: { amount: 32100, symbol: 'FCFA', label: '32100 FCFA' },
  KES: { amount: 6860, symbol: 'KSh', label: 'KSh 6860' }
};

/**
 * GET /api/payments/plans
 * Retourne les plans disponibles avec prix convertis
 */
router.get('/plans', (req, res) => {
  const { currency = 'EUR' } = req.query;
  const price = PRICES[currency.toUpperCase()] || PRICES.EUR;

  res.json({
    plans: [{
      id: 'professional',
      name: 'PROFESSIONAL',
      price: price.amount,
      currency: currency.toUpperCase(),
      symbol: price.symbol,
      label: price.label,
      period: 'monthly',
      features: [
        'Leads illimités',
        'Emails personnalisés illimités',
        'Téléchargements CSV/JSON illimités',
        'Dashboard analytics',
        'Support 24/7',
        'Actualités temps réel',
        '1 licence ordinateur',
        'Mises à jour incluses',
        'RGPD conforme'
      ]
    }]
  });
});

/**
 * POST /api/payments/initiate
 * Initie un paiement FineoPay
 * À connecter à l'API FineoPay réelle
 */
router.post('/initiate', async (req, res) => {
  try {
    const {
      email,
      fingerprint,
      currency = 'EUR',
      payment_method = 'card' // 'card' | 'mobile_money'
    } = req.body;

    if (!email || !fingerprint) {
      return res.status(400).json({ error: 'Email et fingerprint requis' });
    }

    const price = PRICES[currency.toUpperCase()] || PRICES.EUR;

    // Enregistrement de l'intention de paiement
    const paymentIntent = {
      id: `pi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      email,
      fingerprint,
      amount: price.amount,
      currency: currency.toUpperCase(),
      payment_method,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    await insert('payment_intents', paymentIntent).catch(() => {});

    // TODO: Appeler l'API FineoPay pour créer la session de paiement
    // const fineopaySession = await createFineopaySession(paymentIntent);

    res.json({
      success: true,
      payment_id: paymentIntent.id,
      amount: price.amount,
      currency: currency.toUpperCase(),
      label: price.label,
      // payment_url: fineopaySession.checkout_url, // À activer avec FineoPay
      message: 'Intégration FineoPay en cours de configuration. Contactez support@iananoleads.com pour activer votre abonnement.',
      contact: {
        email: 'support@iananoleads.com',
        whatsapp: '+33642535759'
      }
    });
  } catch (err) {
    console.error('[Payments] Erreur initiation:', err.message);
    res.status(500).json({ error: 'Erreur initiation paiement' });
  }
});

/**
 * POST /api/payments/webhook
 * Webhook FineoPay pour confirmation paiement
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['x-fineopay-signature'];
    const secret = process.env.FINEOPAY_WEBHOOK_SECRET;

    // Vérification signature (à implémenter avec FineoPay)
    if (secret && sig !== secret) {
      return res.status(401).json({ error: 'Signature invalide' });
    }

    const event = JSON.parse(req.body.toString());

    if (event.type === 'payment.success') {
      const { email, fingerprint, payment_id } = event.data;

      // Activer la licence
      const { activateLicense } = require('../utils/license');
      await activateLicense({
        email,
        fingerprintHash: fingerprint,
        paymentId: payment_id
      });

      // Enregistrer le paiement
      await insert('payments', {
        payment_id,
        email,
        fingerprint,
        amount: event.data.amount,
        currency: event.data.currency,
        status: 'completed',
        paid_at: new Date().toISOString()
      }).catch(() => {});

      console.log(`[Payments] Paiement confirmé pour ${email}`);
    }

    if (event.type === 'payment.renewed') {
      const { fingerprint } = event.data;
      const { renewLicense } = require('../utils/license');
      await renewLicense(fingerprint);
    }

    if (event.type === 'subscription.cancelled') {
      const { fingerprint } = event.data;
      const { revokeLicense } = require('../utils/license');
      await revokeLicense(fingerprint);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[Payments] Erreur webhook:', err.message);
    res.status(500).json({ error: 'Erreur traitement webhook' });
  }
});

/**
 * Route actualités — expose les news publiquement
 */
const newsRouter = express.Router();
const { fetchSectorNews } = require('../config/newsapi');

newsRouter.get('/:sector', async (req, res) => {
  try {
    const { country = 'FR', count = 5 } = req.query;
    const news = await fetchSectorNews(req.params.sector, country, parseInt(count) || 5);
    res.json({ success: true, articles: news });
  } catch (err) {
    res.status(500).json({ error: 'Erreur récupération actualités' });
  }
});

module.exports = router;
module.exports.newsRouter = newsRouter;
