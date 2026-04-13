/* ================================================
   iaNanoLeads — API Authentification & Licence
   Vérification fingerprint, activation, statut
   ================================================ */

const express = require('express');
const router = express.Router();
const { verifyLicense, activateLicense, renewLicense, revokeLicense } = require('../utils/license');
const { validateFingerprintFormat } = require('../utils/fingerprint');

/**
 * POST /api/auth/verify-license
 * Vérifie si une licence est valide pour le fingerprint fourni
 */
router.post('/verify-license', async (req, res) => {
  try {
    const { fingerprint } = req.body;

    if (!fingerprint) {
      return res.status(400).json({ error: 'Fingerprint requis' });
    }

    if (!validateFingerprintFormat(fingerprint)) {
      return res.status(400).json({ error: 'Format fingerprint invalide' });
    }

    const result = await verifyLicense(fingerprint);

    res.json({
      valid: result.valid,
      reason: result.reason,
      license: result.license ? {
        status: result.license.status,
        expires_at: result.license.expires_at,
        activated_at: result.license.activated_at
      } : null
    });
  } catch (err) {
    console.error('[Auth] Erreur vérification:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/auth/activate
 * Active une licence après paiement confirmé
 * Appelé par le webhook FineoPay
 */
router.post('/activate', async (req, res) => {
  try {
    // Vérification basique du secret webhook
    const webhookSecret = req.headers['x-webhook-secret'];
    if (webhookSecret !== process.env.FINEOPAY_WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Webhook secret invalide' });
    }

    const { userId, email, fingerprint, paymentId } = req.body;

    if (!email || !fingerprint || !paymentId) {
      return res.status(400).json({ error: 'Champs requis : email, fingerprint, paymentId' });
    }

    const license = await activateLicense({ userId, email, fingerprintHash: fingerprint, paymentId });

    res.json({
      success: true,
      message: 'Licence activée avec succès',
      license: {
        status: license.status,
        expires_at: license.expires_at,
        activated_at: license.activated_at
      }
    });
  } catch (err) {
    console.error('[Auth] Erreur activation:', err.message);
    res.status(500).json({ error: 'Erreur activation licence' });
  }
});

/**
 * POST /api/auth/renew
 * Renouvelle une licence (mensuel)
 */
router.post('/renew', async (req, res) => {
  try {
    const webhookSecret = req.headers['x-webhook-secret'];
    if (webhookSecret !== process.env.FINEOPAY_WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Webhook secret invalide' });
    }

    const { fingerprint } = req.body;
    if (!fingerprint) return res.status(400).json({ error: 'Fingerprint requis' });

    await renewLicense(fingerprint);
    res.json({ success: true, message: 'Licence renouvelée' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur renouvellement' });
  }
});

/**
 * POST /api/auth/revoke
 * Révoque une licence (résiliation)
 */
router.post('/revoke', async (req, res) => {
  try {
    const { fingerprint, adminKey } = req.body;
    if (adminKey !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Non autorisé' });
    }
    if (!fingerprint) return res.status(400).json({ error: 'Fingerprint requis' });

    await revokeLicense(fingerprint);
    res.json({ success: true, message: 'Licence révoquée' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur révocation' });
  }
});

module.exports = router;
