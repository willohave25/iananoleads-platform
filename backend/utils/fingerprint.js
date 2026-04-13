/* ================================================
   iaNanoLeads — Génération fingerprint hardware
   Identification unique d'un ordinateur
   ================================================ */

const crypto = require('crypto');
const os = require('os');

/**
 * Génère un fingerprint unique basé sur les informations matérielles
 * Le hash SHA-256 résultant identifie l'ordinateur de façon irréversible
 */
function generateHardwareFingerprint() {
  const components = [
    os.hostname(),
    os.platform(),
    os.arch(),
    os.cpus().map(c => c.model).join(','),
    os.totalmem().toString(),
    // Interfaces réseau (adresses MAC)
    Object.values(os.networkInterfaces())
      .flat()
      .filter(i => i && !i.internal && i.mac !== '00:00:00:00:00:00')
      .map(i => i.mac)
      .sort()
      .join(',')
  ].join('|');

  return hashFingerprint(components);
}

/**
 * Hash SHA-256 d'une chaîne de fingerprint
 */
function hashFingerprint(raw) {
  return crypto
    .createHash('sha256')
    .update(raw + 'W2K-SALT-2025')
    .digest('hex');
}

/**
 * Valide qu'un fingerprint fourni correspond au format attendu
 */
function validateFingerprintFormat(fp) {
  return typeof fp === 'string' && /^[a-f0-9]{64}$/.test(fp);
}

module.exports = { generateHardwareFingerprint, hashFingerprint, validateFingerprintFormat };
