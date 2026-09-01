import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db.js';

const COOKIE = 'fosco_session';

/**
 * In development a fallback secret keeps `npm run dev` frictionless, but a real
 * secret is mandatory in production — sessions would otherwise be forgeable.
 */
function getSecret() {
  const s = process.env.JWT_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  return 'dev-only-insecure-secret';
}

export function login(username, password) {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) return null;
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, getSecret(), {
    expiresIn: '12h',
  });
  return { token, user: { id: user.id, username: user.username, role: user.role } };
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 12 * 60 * 60 * 1000,
};

export const COOKIE_NAME = COOKIE;

/** Gate for every mutating admin endpoint. */
export function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE] || req.headers.authorization?.replace(/^Bearer /, '');
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    req.user = jwt.verify(token, getSecret());
    next();
  } catch {
    res.status(401).json({ error: 'Session expired or invalid' });
  }
}
