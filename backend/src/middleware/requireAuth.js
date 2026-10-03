const crypto = require('crypto');
const User = require('../models/User');

const ALLOWED_ROLES = ['Service Catalog End User'];

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

  if (!token) {
    return res.status(401).json({ message: 'Authentication is required.' });
  }

  try {
    const user = await User.findOne({ sessionTokenHash: hashToken(token) });
    if (!user) {
      return res.status(401).json({ message: 'Authentication is required.' });
    }

    if (!ALLOWED_ROLES.includes(user.role)) {
      return res.status(403).json({ message: 'You do not have access to this resource.' });
    }

    req.user = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
    };
    return next();
  } catch {
    return res.status(500).json({ message: 'Authentication could not be verified.' });
  }
}

module.exports = { requireAuth, hashToken };
