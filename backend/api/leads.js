/* ================================================
   iaNanoLeads — API Leads
   Génération, stockage et téléchargement
   ================================================ */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { supabase, insert, select, uploadFile } = require('../config/supabase');
const { verifyLicense } = require('../utils/license');

// Pays disponibles
const COUNTRIES = {
  FR: 'France', BE: 'Belgique', CH: 'Suisse', LU: 'Luxembourg',
  SN: 'Sénégal', CI: 'Côte d\'Ivoire', CM: 'Cameroun', CD: 'Congo RDC',
  CG: 'Congo', ML: 'Mali', BF: 'Burkina Faso', GN: 'Guinée',
  DE: 'Allemagne', ES: 'Espagne', GB: 'Royaume-Uni', MA: 'Maroc', TN: 'Tunisie'
};

const SECTORS = [
  'tech', 'finance', 'retail', 'healthcare', 'real-estate',
  'hospitality', 'education', 'manufacturing', 'consulting',
  'marketing', 'logistics', 'construction', 'agriculture', 'energy'
];

// Middleware vérification licence
async function checkLicense(req, res, next) {
  const fp = req.headers['x-fingerprint'] || req.body?.fingerprint;
  if (!fp) {
    return res.status(401).json({ error: 'Fingerprint de licence requis' });
  }
  const result = await verifyLicense(fp);
  if (!result.valid) {
    return res.status(403).json({ error: 'Licence invalide : ' + result.reason });
  }
  req.license = result.license;
  next();
}

/**
 * POST /api/leads/generate
 * Génère des leads selon les critères fournis
 */
router.post('/generate', checkLicense, async (req, res) => {
  try {
    const {
      pays = 'FR',
      secteur = 'tech',
      keywords = '',
      count = 50,
      format = 'csv'
    } = req.body;

    if (!COUNTRIES[pays.toUpperCase()]) {
      return res.status(400).json({ error: 'Pays non supporté' });
    }
    if (!SECTORS.includes(secteur.toLowerCase())) {
      return res.status(400).json({ error: 'Secteur non supporté' });
    }
    const nbLeads = Math.min(Math.max(parseInt(count) || 50, 1), 500);

    // Génération des leads (logique métier — à brancher sur source de données réelle)
    const leads = generateLeadsData(pays.toUpperCase(), secteur.toLowerCase(), keywords, nbLeads);

    // Stockage en base
    const batchId = uuidv4();
    const batchRecord = {
      id: batchId,
      license_id: req.license?.id,
      pays: pays.toUpperCase(),
      secteur: secteur.toLowerCase(),
      keywords,
      count: leads.length,
      created_at: new Date().toISOString(),
      status: 'completed'
    };

    await insert('lead_batches', batchRecord).catch(() => {});

    // Génération fichier
    let fileContent, fileName, contentType;
    if (format === 'json') {
      fileContent = JSON.stringify({ batch_id: batchId, leads }, null, 2);
      fileName = `leads-${pays}-${secteur}-${Date.now()}.json`;
      contentType = 'application/json';
    } else {
      fileContent = convertToCSV(leads);
      fileName = `leads-${pays}-${secteur}-${Date.now()}.csv`;
      contentType = 'text/csv';
    }

    // Upload Supabase Storage
    const storagePath = `leads/${batchId}/${fileName}`;
    let downloadUrl = null;
    try {
      downloadUrl = await uploadFile('leads', storagePath, fileContent, contentType);
    } catch (storageErr) {
      console.error('[Leads] Upload storage:', storageErr.message);
    }

    res.json({
      success: true,
      batch_id: batchId,
      count: leads.length,
      pays: COUNTRIES[pays.toUpperCase()],
      secteur,
      download_url: downloadUrl,
      leads: leads.slice(0, 5), // Preview 5 leads
      message: `${leads.length} leads générés avec succès`
    });
  } catch (err) {
    console.error('[Leads] Erreur génération:', err.message);
    res.status(500).json({ error: 'Erreur lors de la génération des leads' });
  }
});

/**
 * GET /api/leads/history
 * Historique des générations pour la licence courante
 */
router.get('/history', checkLicense, async (req, res) => {
  try {
    const history = await select('lead_batches', { license_id: req.license?.id });
    res.json({ history: history || [] });
  } catch (err) {
    res.status(500).json({ error: 'Erreur récupération historique' });
  }
});

// --- Helpers ---

function generateLeadsData(pays, secteur, keywords, count) {
  const paysNom = COUNTRIES[pays] || pays;
  const firstNames = ['Jean', 'Marie', 'Pierre', 'Sophie', 'Marc', 'Fatou', 'Koffi', 'Awa',
    'Thomas', 'Claire', 'Ousmane', 'Aminata', 'Luc', 'Élise', 'Joseph', 'Anna'];
  const lastNames = ['Martin', 'Dupont', 'Bernard', 'Leroy', 'Sow', 'Diallo', 'Yao',
    'Ndiaye', 'Lambert', 'Garnier', 'Mvemba', 'Koulibaly', 'Müller', 'Rossi'];
  const companies = generateCompanyNames(secteur, paysNom);
  const leads = [];

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const company = companies[i % companies.length];
    const emailDomain = company.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);

    leads.push({
      prenom: firstName,
      nom: lastName,
      nom_complet: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${emailDomain}.com`,
      telephone: generatePhone(pays),
      entreprise: company,
      secteur: secteur,
      pays: paysNom,
      code_pays: pays,
      poste: generateTitle(secteur),
      date_generation: new Date().toISOString().split('T')[0]
    });
  }

  return leads;
}

function generateCompanyNames(secteur, pays) {
  const bases = {
    tech: ['TechNova', 'DigiPro', 'InnovateTech', 'CyberBoost', 'DataSmart'],
    finance: ['FinancePlus', 'InvestPro', 'MoneyGrow', 'FinTech360', 'CapitalNet'],
    retail: ['RetailPro', 'ShopExpert', 'CommerceMax', 'TradeBoost', 'SalesPro'],
    healthcare: ['MediCare', 'HealthPro', 'SantéPlus', 'CliniquePro', 'MedBoost'],
    'real-estate': ['ImmoMax', 'HabitatPro', 'FoncierPlus', 'PropriétéNet', 'ImmoBizz'],
    hospitality: ['HotelPro', 'RestaMax', 'TourismePlus', 'HospitalityNet', 'WelcomeGroup'],
    education: ['EduPro', 'FormationPlus', 'SchoolMax', 'LearnBoost', 'EdTechGroup'],
    manufacturing: ['IndustrieMax', 'FabricPro', 'ProductionPlus', 'ManufactNet', 'FactoryPro']
  };
  const base = bases[secteur] || ['EntreprisePro', 'BusinessMax', 'CompanyPlus', 'GroupeNet', 'SASBoost'];
  return base.map(b => `${b} ${pays.split(' ')[0]}`);
}

function generateTitle(secteur) {
  const titles = {
    tech: ['CEO', 'CTO', 'Directeur Innovation', 'Responsable Digital', 'Head of Product'],
    finance: ['Directeur Financier', 'Responsable Investissements', 'CEO', 'Directeur Commercial'],
    retail: ['Directeur Commercial', 'Responsable Ventes', 'CEO', 'Sales Manager'],
    healthcare: ['Directeur Médical', 'Responsable Développement', 'CEO', 'Directeur Administratif'],
    default: ['CEO', 'Directeur Commercial', 'Directeur Général', 'Responsable Business']
  };
  const list = titles[secteur] || titles.default;
  return list[Math.floor(Math.random() * list.length)];
}

function generatePhone(pays) {
  const prefixes = {
    FR: '+33', BE: '+32', CH: '+41', SN: '+221',
    CI: '+225', CM: '+237', CD: '+243', DE: '+49'
  };
  const prefix = prefixes[pays] || '+33';
  const number = Math.floor(Math.random() * 900000000 + 100000000).toString();
  return `${prefix} ${number.slice(0,1)} ${number.slice(1,3)} ${number.slice(3,5)} ${number.slice(5,7)} ${number.slice(7,9)}`;
}

function convertToCSV(leads) {
  if (!leads.length) return '';
  const headers = Object.keys(leads[0]);
  const rows = leads.map(l => headers.map(h => `"${(l[h] || '').toString().replace(/"/g, '""')}"`).join(','));
  return [headers.join(','), ...rows].join('\n');
}

module.exports = router;
