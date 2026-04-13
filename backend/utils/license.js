/* ================================================
   iaNanoLeads — Gestion des licences
   Vérification, activation, blocage
   ================================================ */

const { supabase, select, insert, update } = require('../config/supabase');
const { validateFingerprintFormat } = require('./fingerprint');

/**
 * Vérifie si une licence est valide pour le fingerprint donné
 * @returns {{ valid: boolean, reason?: string, license?: object }}
 */
async function verifyLicense(fingerprintHash) {
  if (!validateFingerprintFormat(fingerprintHash)) {
    return { valid: false, reason: 'Fingerprint invalide' };
  }

  try {
    const licenses = await select('licenses', { fingerprint: fingerprintHash });

    if (!licenses || licenses.length === 0) {
      return { valid: false, reason: 'Licence introuvable pour cet ordinateur' };
    }

    const license = licenses[0];

    if (license.status !== 'active') {
      return { valid: false, reason: `Licence ${license.status}`, license };
    }

    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      // Marquer comme expirée
      await update('licenses', { id: license.id }, { status: 'expired' });
      return { valid: false, reason: 'Licence expirée', license };
    }

    // Mise à jour last_seen
    await update('licenses', { id: license.id }, {
      last_seen_at: new Date().toISOString()
    }).catch(() => {}); // Non bloquant

    return { valid: true, license };
  } catch (err) {
    console.error('[License] Erreur vérification:', err.message);
    // En cas d'erreur DB, on laisse passer (fail-open) pour éviter de bloquer les clients
    return { valid: true, reason: 'Vérification indisponible' };
  }
}

/**
 * Active une nouvelle licence après paiement
 */
async function activateLicense({ userId, email, fingerprintHash, paymentId }) {
  if (!validateFingerprintFormat(fingerprintHash)) {
    throw new Error('Fingerprint invalide');
  }

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  const licenseData = {
    user_id: userId,
    email,
    fingerprint: fingerprintHash,
    status: 'active',
    payment_id: paymentId,
    activated_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
    last_seen_at: new Date().toISOString()
  };

  const result = await insert('licenses', licenseData);
  return result[0];
}

/**
 * Renouvelle une licence existante d'un mois
 */
async function renewLicense(fingerprintHash) {
  const licenses = await select('licenses', { fingerprint: fingerprintHash });
  if (!licenses || licenses.length === 0) throw new Error('Licence introuvable');

  const license = licenses[0];
  const currentExpiry = license.expires_at ? new Date(license.expires_at) : new Date();
  const newExpiry = new Date(Math.max(currentExpiry, new Date()));
  newExpiry.setMonth(newExpiry.getMonth() + 1);

  return update('licenses', { id: license.id }, {
    status: 'active',
    expires_at: newExpiry.toISOString()
  });
}

/**
 * Révoque une licence (résiliation)
 */
async function revokeLicense(fingerprintHash) {
  return update('licenses', { fingerprint: fingerprintHash }, {
    status: 'revoked',
    revoked_at: new Date().toISOString()
  });
}

module.exports = { verifyLicense, activateLicense, renewLicense, revokeLicense };
