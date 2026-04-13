/* ================================================
   iaNanoLeads - Assistant virtuel W2K
   Widget chatbot FAQ + escalade support
   W2K-Digital © 2025
   ================================================ */

(function () {

  var FAQ = [
    {
      keywords: ['tarif', 'prix', 'coût', 'combien', '49', 'price'],
      answer: 'Notre formule PROFESSIONAL est à <strong>€49/mois</strong> — tout illimité. Leads, emails, téléchargements, dashboard et support 24/7 inclus. Aucun frais caché.'
    },
    {
      keywords: ['essai', 'gratuit', 'trial', 'test', 'demo'],
      answer: 'Pas d\'essai gratuit — nous offrons une activation immédiate avec une <strong>garantie satisfait ou remboursé 30 jours</strong> sur le premier mois. Zéro risque.'
    },
    {
      keywords: ['annul', 'résilier', 'résiliation', 'cancel', 'stopper'],
      answer: 'Vous pouvez résilier à tout moment depuis votre dashboard. La résiliation prend effet en fin de mois en cours. Aucun engagement long terme.'
    },
    {
      keywords: ['licence', 'ordinateur', 'machine', 'pc', 'computer'],
      answer: '1 licence = 1 ordinateur via empreinte matérielle unique. L\'utilisation est verrouillée à la machine licenciée pour garantir la sécurité de votre abonnement.'
    },
    {
      keywords: ['pays', 'secteur', 'ciblage', 'filtre', 'afrique', 'europe', 'france'],
      answer: 'Nous couvrons <strong>la France, Belgique, Suisse, Côte d\'Ivoire, Sénégal, Cameroun</strong> et bien d\'autres. Secteurs : Tech, Finance, Retail, Healthcare, Immobilier, Hospitality, Education, Manufacturing et plus.'
    },
    {
      keywords: ['csv', 'json', 'télécharg', 'export', 'download'],
      answer: 'Téléchargements illimités inclus au format CSV et JSON. Chaque fichier inclut : nom, email, téléphone, entreprise, secteur, pays. Prêt pour votre CRM.'
    },
    {
      keywords: ['email', 'mail', 'personnalis', 'message'],
      answer: 'Notre moteur de personnalisation génère des emails contextuels pour chaque lead, intégrant les actualités récentes du secteur pour maximiser le taux d\'ouverture.'
    },
    {
      keywords: ['rgpd', 'données', 'confidential', 'sécurité', 'gdpr'],
      answer: 'Conformité RGPD totale. Données chiffrées SSL/TLS, stockage sécurisé Supabase, fingerprint hashé SHA-256. Aucune donnée sensible partagée commercialement.'
    },
    {
      keywords: ['paiement', 'cb', 'carte', 'mobile money', 'fineopay'],
      answer: 'Paiement sécurisé via <strong>FineoPay</strong> : CB Visa/Mastercard et Mobile Money (Orange Money, Wave, MTN). Chiffrement end-to-end.'
    },
    {
      keywords: ['contact', 'humain', 'support', 'aide', 'whatsapp'],
      answer: 'Support automatisé 24/7 ici. Pour un humain : email <strong>support@iananoleads.com</strong> ou WhatsApp <a href="https://wa.me/33642535759" target="_blank" rel="noopener" style="color:var(--primary-gold)">+33 6 42 53 57 59</a>. Lun-Ven 9h-18h CET.'
    },
    {
      keywords: ['fonctionn', 'feature', 'que fait', 'capabilities', 'comment'],
      answer: 'iaNanoLeads : (1) Sélectionnez pays + secteur → (2) Nos algorithmes avancés génèrent les leads qualifiés → (3) Téléchargez CSV/JSON + emails personnalisés prêts. Tout en quelques minutes.'
    }
  ];

  var DEFAULT_ANSWER = 'Je n\'ai pas la réponse exacte, mais notre équipe est là ! Contactez-nous : <strong>support@iananoleads.com</strong> ou WhatsApp <a href="https://wa.me/33642535759" target="_blank" rel="noopener" style="color:var(--primary-gold)">+33 6 42 53 57 59</a>.';

  function findAnswer(question) {
    var q = question.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (var i = 0; i < FAQ.length; i++) {
      for (var j = 0; j < FAQ[i].keywords.length; j++) {
        if (q.includes(FAQ[i].keywords[j])) return FAQ[i].answer;
      }
    }
    return DEFAULT_ANSWER;
  }

  function buildWidget() {
    var widget = document.createElement('div');
    widget.id = 'chatbot-widget';
    widget.innerHTML = [
      '<div class="chatbot-window" id="chatbot-window">',
        '<div class="chatbot-header">',
          '<div class="avatar">🤖</div>',
          '<div>',
            '<h4>Assistant W2K</h4>',
            '<p>En ligne • Répond instantanément</p>',
          '</div>',
        '</div>',
        '<div class="chatbot-messages" id="chatbot-messages">',
          '<div class="chat-msg bot">Bonjour ! Je suis l\'assistant virtuel W2K. Comment puis-je vous aider avec iaNanoLeads ? 👋</div>',
        '</div>',
        '<div class="chatbot-quick-btns">',
          '<button class="chatbot-quick-btn" data-q="Quel est le tarif ?">Tarif</button>',
          '<button class="chatbot-quick-btn" data-q="Comment ça fonctionne ?">Fonctionnement</button>',
          '<button class="chatbot-quick-btn" data-q="Puis-je annuler ?">Annulation</button>',
          '<button class="chatbot-quick-btn" data-q="Quels pays sont couverts ?">Pays couverts</button>',
        '</div>',
        '<div class="chatbot-input-area">',
          '<input type="text" id="chatbot-input" placeholder="Posez votre question..." aria-label="Message pour l\'assistant">',
          '<button id="chatbot-send" aria-label="Envoyer">➤</button>',
        '</div>',
      '</div>',
      '<button class="chatbot-toggle" id="chatbot-toggle" aria-label="Ouvrir le chat" title="Assistant W2K">💬</button>'
    ].join('');

    document.body.appendChild(widget);

    var toggleBtn = document.getElementById('chatbot-toggle');
    var window_ = document.getElementById('chatbot-window');
    var messages = document.getElementById('chatbot-messages');
    var input = document.getElementById('chatbot-input');
    var sendBtn = document.getElementById('chatbot-send');

    function addMessage(text, type) {
      var msg = document.createElement('div');
      msg.className = 'chat-msg ' + type;
      msg.innerHTML = text;
      messages.appendChild(msg);
      messages.scrollTop = messages.scrollHeight;
    }

    function handleQuestion(q) {
      if (!q.trim()) return;
      addMessage(q, 'user');
      input.value = '';
      // Simulation délai de réponse
      setTimeout(function () {
        addMessage(findAnswer(q), 'bot');
      }, 400);
    }

    toggleBtn.addEventListener('click', function () {
      window_.classList.toggle('open');
      toggleBtn.textContent = window_.classList.contains('open') ? '✕' : '💬';
    });

    sendBtn.addEventListener('click', function () { handleQuestion(input.value); });

    input.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') handleQuestion(input.value);
    });

    document.querySelectorAll('.chatbot-quick-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        handleQuestion(btn.dataset.q);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildWidget);
  } else {
    buildWidget();
  }

})();
