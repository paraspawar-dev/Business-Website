const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authentication token missing or invalid' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change-this-to-a-random-string');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Token expired or invalid' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, error: 'Admin privileges required' });
  }
}

module.exports = {
  requireAuth,
  requireAdmin
};
