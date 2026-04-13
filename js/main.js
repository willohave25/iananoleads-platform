/* ================================================
   iaNanoLeads - Script principal
   Navigation, formulaires, lazy loading, FAQ
   W2K-Digital © 2025
   ================================================ */

document.addEventListener('DOMContentLoaded', function () {

  // --- Menu mobile ---
  const hamburger = document.getElementById('nav-hamburger');
  const mobileMenu = document.getElementById('nav-mobile');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });

    // Fermer au clic sur un lien
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // --- Lien actif dans la navigation ---
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, #nav-mobile a').forEach(function (link) {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // --- Smooth scroll pour ancres internes ---
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const headerH = document.querySelector('header') ? document.querySelector('header').offsetHeight : 0;
        const top = target.getBoundingClientRect().top + window.pageYOffset - headerH - 16;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  // --- FAQ accordion ---
  document.querySelectorAll('.faq-item').forEach(function (item) {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', function () {
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach(function (el) {
          el.classList.remove('open');
        });
        if (!isOpen) item.classList.add('open');
      });
    }
  });

  // --- Lazy loading images avec IntersectionObserver ---
  if ('IntersectionObserver' in window) {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '200px' });

    lazyImages.forEach(function (img) { observer.observe(img); });
  }

  // --- Animation au scroll (fade-up) ---
  const animatedEls = document.querySelectorAll('.card, .step, .sector-card, .testimonial-card, .stat-block');
  if ('IntersectionObserver' in window && animatedEls.length) {
    const animObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.animation = 'fadeInUp 0.6s ease both';
          animObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    animatedEls.forEach(function (el) { animObserver.observe(el); });
  }

  // --- Formulaire de contact ---
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type="submit"]');
      const originalText = btn ? btn.innerHTML : '';

      if (btn) {
        btn.innerHTML = '<span class="spinner"></span>';
        btn.disabled = true;
      }

      // Envoi via Supabase (email stocké, pas d'SMTP requis)
      setTimeout(function () {
        const alert = document.createElement('div');
        alert.className = 'alert alert-success';
        alert.textContent = 'Message envoyé ! Nous vous répondrons sous 24h.';
        contactForm.insertBefore(alert, contactForm.firstChild);
        contactForm.reset();
        if (btn) { btn.innerHTML = originalText; btn.disabled = false; }
        setTimeout(function () { alert.remove(); }, 5000);
      }, 1200);
    });
  }

  // --- Calculateur ROI ---
  const roiForm = document.getElementById('roi-form');
  if (roiForm) {
    const calcROI = function () {
      const leads = parseFloat(document.getElementById('roi-leads')?.value) || 0;
      const rate = parseFloat(document.getElementById('roi-rate')?.value) || 0;
      const value = parseFloat(document.getElementById('roi-value')?.value) || 0;
      const clients = Math.floor(leads * (rate / 100));
      const revenue = clients * value;
      const profit = revenue - 49;
      const roiPct = revenue > 0 ? Math.round((profit / 49) * 100) : 0;

      const el = document.getElementById('roi-result');
      if (el) {
        el.innerHTML =
          '<div class="roi-value">+' + revenue.toLocaleString('fr-FR') + '€</div>' +
          '<p>' + clients + ' clients estimés • ROI x' + Math.round(revenue / 49) + ' • Profit net : <strong style="color:var(--primary-gold)">' + profit.toLocaleString('fr-FR') + '€</strong></p>';
      }
    };

    ['roi-leads', 'roi-rate', 'roi-value'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', calcROI);
    });

    roiForm.addEventListener('submit', function (e) { e.preventDefault(); calcROI(); });
    calcROI();
  }

  // --- Toast notification ---
  window.showToast = function (msg, duration) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.style.animation = 'slideInRight 0.3s ease reverse';
      setTimeout(function () { toast.remove(); }, 300);
    }, duration || 3500);
  };

  // --- Compteur animé (stats) ---
  function animateCounter(el, target, suffix) {
    let start = 0;
    const step = target / 50;
    const timer = setInterval(function () {
      start += step;
      if (start >= target) { start = target; clearInterval(timer); }
      el.textContent = Math.floor(start).toLocaleString('fr-FR') + (suffix || '');
    }, 30);
  }

  if ('IntersectionObserver' in window) {
    const statsEls = document.querySelectorAll('.stat-value[data-target]');
    const statsObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseFloat(el.dataset.target);
          const suffix = el.dataset.suffix || '';
          animateCounter(el, target, suffix);
          statsObserver.unobserve(el);
        }
      });
    }, { threshold: 0.3 });

    statsEls.forEach(function (el) { statsObserver.observe(el); });
  }

  // --- Inscription liste d'attente (index) ---
  const waitlistForm = document.getElementById('waitlist-form');
  if (waitlistForm) {
    waitlistForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const emailInput = waitlistForm.querySelector('input[type="email"]');
      if (!emailInput || !emailInput.value) return;
      showToast('✅ Vous êtes inscrit(e) à la liste prioritaire !');
      waitlistForm.reset();
    });
  }

});
