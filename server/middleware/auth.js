const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'naukriboost_dev_secret_change_in_production';

/**
 * Auth middleware — Verifies JWT from Authorization header.
 * Attaches `req.user` with { id, email, role } on success.
 * Returns 401 if token is missing or invalid.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
}

/**
 * Generates a JWT token for a user.
 * @param {Object} user - { id, email, role }
 * @returns {string} JWT token (expires in 7 days)
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = { authenticate, generateToken };
