/* ================================================
   iaNanoLeads - Vérification de licence
   Fingerprint navigateur + vérification Supabase
   W2K-Digital © 2025
   ================================================ */

(function () {

  var SUPABASE_URL = 'https://ilycnutphhmuvaonkrsa.supabase.co';
  var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlseWNudXRwaGhtdXZhb25rcnNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MjY5NDcsImV4cCI6MjA5MDEwMjk0N30.80ipBwMVvAkC2f0Oz2Wzl8E6GjMwlLCoE72XbePtmnM';

  // Génération fingerprint navigateur (non-hardware, côté navigateur)
  function generateFingerprint() {
    var components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.platform,
      navigator.hardwareConcurrency || '',
      navigator.deviceMemory || '',
      window.devicePixelRatio || ''
    ];

    // Canvas fingerprint
    try {
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#D4AF37';
      ctx.fillText('W2K-iaNanoLeads', 2, 2);
      components.push(canvas.toDataURL().slice(-20));
    } catch (e) {}

    return components.join('|');
  }

  // Hash SHA-256 simple (via SubtleCrypto)
  async function hashString(str) {
    if (window.crypto && window.crypto.subtle) {
      var enc = new TextEncoder();
      var buf = await window.crypto.subtle.digest('SHA-256', enc.encode(str));
      return Array.from(new Uint8Array(buf))
        .map(function (b) { return b.toString(16).padStart(2, '0'); })
        .join('');
    }
    // Fallback basique si SubtleCrypto indisponible
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  // Vérification licence via Supabase
  async function verifyLicense(fingerprintHash) {
    try {
      var resp = await fetch(SUPABASE_URL + '/rest/v1/licenses?fingerprint=eq.' + fingerprintHash + '&select=id,status,expires_at', {
        headers: {
          'apikey': SUPABASE_ANON,
          'Authorization': 'Bearer ' + SUPABASE_ANON
        }
      });
      if (!resp.ok) return null;
      var data = await resp.json();
      return data && data.length > 0 ? data[0] : null;
    } catch (e) {
      return null;
    }
  }

  // Afficher le blocage si licence invalide
  function showLicenseBlock() {
    var overlay = document.createElement('div');
    overlay.id = 'license-block';
    overlay.style.cssText = [
      'position:fixed;inset:0;z-index:99999',
      'background:rgba(0,0,0,0.97)',
      'display:flex;align-items:center;justify-content:center',
      'flex-direction:column;gap:24px;padding:40px;text-align:center'
    ].join(';');
    overlay.innerHTML = [
      '<div style="font-size:48px">🔒</div>',
      '<h2 style="font-family:Montserrat,sans-serif;color:#D4AF37;font-size:24px">Accès non autorisé</h2>',
      '<p style="color:#ccc;max-width:400px;line-height:1.7">Cette licence est enregistrée sur un autre ordinateur.',
      'Contactez le support pour transférer ou activer une nouvelle licence.</p>',
      '<a href="contact.html" style="background:linear-gradient(135deg,#D4AF37,#FFD700);color:#000;',
      'padding:14px 32px;border-radius:8px;font-weight:700;text-decoration:none">Contacter le support</a>'
    ].join('');
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
  }

  // Initialisation — uniquement sur les pages protégées (dashboard, etc.)
  // Sur le site public marketing, la vérification est optionnelle
  window.W2K_License = {
    getFingerprint: async function () {
      var raw = generateFingerprint();
      return await hashString(raw);
    },
    verify: async function () {
      var hash = await window.W2K_License.getFingerprint();
      var license = await verifyLicense(hash);
      window.W2K_LICENSE_STATUS = license;
      return license;
    },
    blockIfInvalid: async function () {
      var license = await window.W2K_License.verify();
      if (!license || license.status !== 'active') {
        showLicenseBlock();
        return false;
      }
      if (license.expires_at && new Date(license.expires_at) < new Date()) {
        showLicenseBlock();
        return false;
      }
      return true;
    }
  };

})();
