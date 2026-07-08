const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const DB = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("CRITICAL ERROR: JWT_SECRET environment variable is missing.");
  process.exit(1);
}

// Login Rate Limiter (Brute-force protection)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per window
  message: { success: false, error: 'Too many login attempts, please try again after 15 minutes' }
});

// POST /auth/login
router.post('/login', loginLimiter, (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password are required' });
  }

  try {
    const user = DB.get('SELECT * FROM admin_users WHERE username = ? AND is_active = 1', [username]);
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Update last login
    DB.run('UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    const tokenPayload = {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      role: user.role
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '15m' });

    // Log the audit event
    DB.logAudit(user.username, 'Login', 'System', null, 'User logged in successfully');

    res.json({
      success: true,
      data: {
        token,
        user: tokenPayload
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
// POST /auth/logout
router.post('/logout', requireAuth, (req, res) => {
  try {
    DB.logAudit(req.user.username, 'Logout', 'System', null, 'User logged out');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /auth/me
router.get('/me', requireAuth, (req, res) => {
  try {
    const user = DB.get('SELECT id, username, display_name, role, photo_url, recovery_phone, created_at FROM admin_users WHERE id = ? AND is_active = 1', [req.user.id]);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found or inactive' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /auth/password
router.put('/password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, error: 'Current and new passwords are required' });
  }
  
  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, error: 'New password must be at least 8 characters' });
  }

  try {
    const user = DB.get('SELECT password_hash FROM admin_users WHERE id = ?', [req.user.id]);
    
    if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(401).json({ success: false, error: 'Incorrect current password' });
    }

    const newHash = bcrypt.hashSync(newPassword, 12);
    DB.run('UPDATE admin_users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);

    res.json({ success: true, data: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
