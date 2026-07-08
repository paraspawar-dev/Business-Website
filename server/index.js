require('dotenv').config({ path: require('path').join(__dirname, '.env') });
console.log("Loaded JWT_SECRET:", process.env.JWT_SECRET);
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Initialize database
const runSeeder = require('./db/init');
runSeeder();

// Import Routes
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');

// Import Middleware
const { requireAuth, requireAdmin } = require('./middleware/auth');
const localOnly = require('./middleware/localOnly');

// Initialize WhatsApp Bot
require('./whatsapp/bot');

// --- PUBLIC APP (PORT 3000) ---
const publicApp = express();
const PUBLIC_PORT = process.env.PORT || 3000;

const cspConfig = {
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
};

publicApp.use(helmet(cspConfig));
publicApp.use(cors());
publicApp.use(express.json());
publicApp.set('trust proxy', 1); // Trust the first proxy (Nginx)

// Public API Rate Limiter
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests, please try again later.'
});

// Mount Public API
publicApp.use('/api', publicLimiter, apiRoutes);

// Serve Static Frontend (from project root)
publicApp.use(express.static(path.join(__dirname, '..')));

publicApp.listen(PUBLIC_PORT, () => {
  console.log(`🚀 Public Server running at http://localhost:${PUBLIC_PORT}`);
});


// --- ADMIN APP (PORT 4000) ---
const adminApp = express();
const ADMIN_PORT = process.env.ADMIN_PORT || 4000;

adminApp.use(helmet(cspConfig));
adminApp.use(cors());
adminApp.use(express.json());
adminApp.set('trust proxy', 1); // Trust the first proxy (Nginx)

// Restrict to local network
adminApp.use(localOnly);

// Admin API Rate Limiter
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200
});

// Mount Admin Routes
adminApp.use('/api/auth', authRoutes);
adminApp.use('/api/admin', adminLimiter, requireAuth, adminRoutes);

// Serve Admin Frontend
adminApp.use(express.static(path.join(__dirname, '../admin')));

// Serve assets so they can be accessed from the admin panel (e.g. /assets/logo.png)
adminApp.use('/assets', express.static(path.join(__dirname, '../assets')));

// SPA Fallback for Admin App (React Router)
adminApp.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin/index.html'));
});

adminApp.listen(ADMIN_PORT, () => {
  console.log(`🔒 Admin Server running at http://localhost:${ADMIN_PORT}`);
});
