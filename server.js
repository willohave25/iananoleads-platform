/* ================================================
   iaNanoLeads — Serveur Express principal
   API Backend SaaS B2B W2K-Digital
   ================================================ */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const leadsRoutes = require('./api/leads');
const emailsRoutes = require('./api/emails');
const authRoutes = require('./api/auth');
const paymentsRoutes = require('./api/payments');
const newsRoutes = require('./api/news');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Sécurité HTTP headers ---
app.use(helmet());

// --- CORS ---
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://www.iananoleads.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-License-Key']
}));

// --- Parsing JSON ---
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// --- Rate limiting global ---
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Trop de requêtes. Réessayez dans 15 minutes.' }
});
app.use(globalLimiter);

// --- Rate limiting strict pour la génération ---
const generateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'Limite de génération atteinte. Attendez 1 minute.' }
});

// --- Routes API ---
app.use('/api/leads', generateLimiter, leadsRoutes);
app.use('/api/emails', generateLimiter, emailsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/news', newsRoutes);

// --- Santé du serveur ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'iaNanoLeads API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// --- Gestion erreurs globale ---
app.use((err, req, res, next) => {
  console.error('[Erreur]', err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? 'Erreur serveur interne.' : err.message
  });
});

// --- 404 ---
app.use((req, res) => {
  res.status(404).json({ error: 'Route introuvable.' });
});

// --- Démarrage ---
app.listen(PORT, () => {
  console.log(`[iaNanoLeads] Serveur démarré sur le port ${PORT} — ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
