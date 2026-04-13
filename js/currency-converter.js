/* ================================================
   iaNanoLeads - Convertisseur de devise
   Mise à jour dynamique des prix selon la devise détectée
   W2K-Digital © 2025
   ================================================ */

(function () {

  // Formater un montant selon la locale
  function formatPrice(amount, currencyCode) {
    var locales = {
      EUR: 'fr-FR', USD: 'en-US', GBP: 'en-GB',
      CHF: 'de-CH', FCFA: 'fr-FR', KES: 'sw-KE'
    };
    try {
      return new Intl.NumberFormat(locales[currencyCode] || 'fr-FR', {
        style: 'currency',
        currency: ['FCFA', 'KES'].includes(currencyCode) ? 'EUR' : currencyCode,
        maximumFractionDigits: 0
      }).format(amount).replace('€', currencyCode === 'FCFA' ? 'FCFA' : (currencyCode === 'KES' ? 'KSh' : '€'));
    } catch (e) {
      return amount + ' ' + currencyCode;
    }
  }

  // Mise à jour des éléments d'affichage de prix
  function updatePriceDisplay(currencyInfo) {
    if (!currencyInfo) return;
    var rate = currencyInfo.rate || 1;
    var symbol = currencyInfo.symbol || '€';
    var code = currencyInfo.code || 'EUR';
    var basePrice = 49;
    var converted = Math.round(basePrice * rate);

    document.querySelectorAll('[data-price]').forEach(function (el) {
      el.textContent = symbol + converted;
    });
    document.querySelectorAll('[data-price-amount]').forEach(function (el) {
      el.textContent = converted;
    });
    document.querySelectorAll('[data-currency-symbol]').forEach(function (el) {
      el.textContent = symbol;
    });
    document.querySelectorAll('[data-currency-code]').forEach(function (el) {
      el.textContent = code;
    });
    document.querySelectorAll('[data-price-full]').forEach(function (el) {
      el.textContent = symbol + converted + '/mois';
    });
  }

  // Écouter l'événement émis par geolocation.js
  document.addEventListener('DOMContentLoaded', function () {
    // Tenter de charger depuis le cache localStorage
    try {
      var cached = JSON.parse(localStorage.getItem('w2k_currency') || 'null');
      if (cached) updatePriceDisplay(cached);
    } catch (e) {}

    // Polling léger au cas où W2K_CURRENCY n'est pas encore défini
    var attempts = 0;
    var interval = setInterval(function () {
      if (window.W2K_CURRENCY) {
        updatePriceDisplay(window.W2K_CURRENCY);
        clearInterval(interval);
      }
      if (++attempts > 20) clearInterval(interval);
    }, 300);
  });

})();
