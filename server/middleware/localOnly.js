function localOnly(req, res, next) {
  if (process.env.ALLOW_EXTERNAL_ADMIN === 'true') {
    return next();
  }

  const clientIp = req.ip || req.connection.remoteAddress;
  
  // Normalize IPv6 mapped IPv4
  const normalizedIp = clientIp.includes('::ffff:') ? clientIp.split('::ffff:')[1] : clientIp;

  // Check if IP is localhost or a private network address (10.x, 172.16-31.x, 192.168.x)
  const isLocalhost = normalizedIp === '127.0.0.1' || normalizedIp === '::1';
  
  let isPrivate = false;
  if (normalizedIp.includes('.')) {
    const parts = normalizedIp.split('.').map(Number);
    if (
      parts[0] === 10 ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168)
    ) {
      isPrivate = true;
    }
  }

  if (isLocalhost || isPrivate) {
    next();
  } else {
    console.warn(`Blocked external access attempt to admin panel from IP: ${clientIp}`);
    res.status(403).json({ success: false, error: 'Access denied. Admin panel is restricted to the local network.' });
  }
}

module.exports = localOnly;
