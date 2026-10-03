const crypto = require('crypto');
const User = require('../models/User');

const USER_ROLE = 'Service Catalog End User';
const ADMIN_ROLE = 'Admin';

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function requireRoles(allowedRoles) {
  return async function requireRolesMiddleware(req, res, next) {
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

      if (!allowedRoles.includes(user.role)) {
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
  };
}

const requireAuth = requireRoles([USER_ROLE]);
const requireAdmin = requireRoles([ADMIN_ROLE]);

module.exports = { requireAuth, requireAdmin, hashToken };
