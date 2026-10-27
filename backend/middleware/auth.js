const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const COOKIE_NAME = 'planning_session';
const SESSION_SECONDS = 60 * 60 * 24 * 7;
if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error('JWT_SECRET doit contenir au moins 32 caractères en production');
}
const secret = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.JWT_SECRET) console.warn('SESSION : secret temporaire. Définir JWT_SECRET pour conserver les sessions après redémarrage.');

function makeCookie(req, value, maxAge = SESSION_SECONDS) {
  const secure = process.env.NODE_ENV === 'production' || req.secure;
  return `${COOKIE_NAME}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}
function createSession(req, res, userId) {
  const token = jwt.sign({ sub: userId }, secret, { algorithm: 'HS256', expiresIn: SESSION_SECONDS, issuer: 'planning-intelligent' });
  res.setHeader('Set-Cookie', makeCookie(req, token));
}
function clearSession(req, res) { res.setHeader('Set-Cookie', makeCookie(req, '', 0)); }
function authenticate(req, res, next) {
  const raw = req.headers.cookie || '';
  const cookie = raw.split(';').map(p => p.trim()).find(p => p.startsWith(COOKIE_NAME + '='));
  if (!cookie) return res.status(401).json({ success: false, message: 'Connexion requise' });
  try {
    const payload = jwt.verify(cookie.slice(COOKIE_NAME.length + 1), secret, { algorithms: ['HS256'], issuer: 'planning-intelligent' });
    if (typeof payload.sub !== 'string') throw new Error('Token invalide');
    req.userId = payload.sub;
    next();
  } catch (_) {
    return res.status(401).json({ success: false, message: 'Session expirée. Veuillez vous reconnecter.' });
  }
}
function selfId(id, req, res) {
  if (id !== req.userId) {
    res.status(403).json({ success: false, message: 'Accès interdit aux données d’un autre utilisateur' });
    return false;
  }
  return true;
}
function bodySelf(req, res, next) { if (selfId(req.body?.utilisateur_id, req, res)) next(); }
function paramSelf(req, res, next) { if (selfId(req.params.utilisateur_id, req, res)) next(); }
module.exports = { authenticate, createSession, clearSession, selfId, bodySelf, paramSelf };
