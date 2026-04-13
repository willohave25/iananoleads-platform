/* ================================================
   iaNanoLeads - Géolocalisation IP
   Détection pays → langue + devise auto
   W2K-Digital © 2025
   ================================================ */

(function () {

  // Mapping pays → langue
  var COUNTRY_LANG = {
    FR: 'fr', BE: 'fr', CH: 'fr', LU: 'fr', MC: 'fr',
    SN: 'fr', CI: 'fr', CM: 'fr', CD: 'fr', CG: 'fr',
    ML: 'fr', BF: 'fr', NE: 'fr', TD: 'fr', GN: 'fr',
    DE: 'de', AT: 'de',
    ES: 'es', MX: 'es', CO: 'es', AR: 'es',
    KE: 'sw', TZ: 'sw', UG: 'sw'
  };

  // Mapping pays → devise
  var COUNTRY_CURRENCY = {
    FR: 'EUR', BE: 'EUR', DE: 'EUR', ES: 'EUR', AT: 'EUR', LU: 'EUR', MC: 'EUR',
    CH: 'CHF',
    GB: 'GBP',
    US: 'USD', CA: 'USD',
    MX: 'USD', CO: 'USD', AR: 'USD',
    SN: 'FCFA', CI: 'FCFA', CM: 'FCFA', CD: 'FCFA', CG: 'FCFA',
    ML: 'FCFA', BF: 'FCFA', NE: 'FCFA', TD: 'FCFA', GN: 'FCFA',
    KE: 'KES', TZ: 'KES', UG: 'KES'
  };

  // Taux de conversion depuis EUR
  var RATES = {
    EUR: 1,
    USD: 1.08,
    GBP: 0.86,
    CHF: 0.96,
    FCFA: 655,
    KES: 140
  };

  var SYMBOLS = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF', FCFA: 'FCFA', KES: 'KSh' };

  function applyLanguage(lang) {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-lang]').forEach(function (el) {
      el.classList.remove('active');
    });
    document.querySelectorAll('[data-lang="' + lang + '"]').forEach(function (el) {
      el.classList.add('active');
    });
    // Fallback : activer le français si rien n'est actif
    var active = document.querySelectorAll('[data-lang].active');
    if (active.length === 0) {
      document.querySelectorAll('[data-lang="fr"]').forEach(function (el) {
        el.classList.add('active');
      });
    }
    localStorage.setItem('w2k_lang', lang);
  }

  function applyCurrency(currency, country) {
    var rate = RATES[currency] || 1;
    var symbol = SYMBOLS[currency] || currency;
    var basePrice = 49; // EUR
    var converted = Math.round(basePrice * rate);

    // Afficher le prix converti partout
    document.querySelectorAll('[data-price]').forEach(function (el) {
      el.textContent = symbol + converted;
    });
    document.querySelectorAll('[data-price-amount]').forEach(function (el) {
      el.textContent = converted;
    });
    document.querySelectorAll('[data-currency-symbol]').forEach(function (el) {
      el.textContent = symbol;
    });

    window.W2K_CURRENCY = { code: currency, symbol: symbol, rate: rate, country: country };
    localStorage.setItem('w2k_currency', JSON.stringify(window.W2K_CURRENCY));
  }

  function detectAndApply(data) {
    var country = (data && data.country_code) ? data.country_code.toUpperCase() : 'FR';
    var lang = COUNTRY_LANG[country] || 'fr';
    var currency = COUNTRY_CURRENCY[country] || 'EUR';
    applyLanguage(lang);
    applyCurrency(currency, country);
    window.W2K_COUNTRY = country;
  }

  function loadFromCache() {
    try {
      var cachedLang = localStorage.getItem('w2k_lang');
      var cachedCurr = JSON.parse(localStorage.getItem('w2k_currency') || 'null');
      if (cachedLang) applyLanguage(cachedLang);
      if (cachedCurr) {
        applyCurrency(cachedCurr.code, cachedCurr.country);
      }
      return !!(cachedLang || cachedCurr);
    } catch (e) {
      return false;
    }
  }

  // Initialisation
  document.addEventListener('DOMContentLoaded', function () {
    // Activer FR par défaut immédiatement pour éviter le flash
    document.querySelectorAll('[data-lang="fr"]').forEach(function (el) {
      el.classList.add('active');
    });

    // Charger depuis le cache d'abord
    loadFromCache();

    // Détection IP
    fetch('https://ipapi.co/json/', { method: 'GET' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        detectAndApply(data);
        // Cache 24h
        localStorage.setItem('w2k_geo_ts', Date.now().toString());
      })
      .catch(function () {
        // Fallback silencieux : garder FR/EUR
        applyLanguage('fr');
        applyCurrency('EUR', 'FR');
      });

    // Sélecteur de langue manuel (si présent dans la page)
    document.querySelectorAll('[data-lang-btn]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var lang = btn.dataset.langBtn;
        applyLanguage(lang);
      });
    });
  });

})();
