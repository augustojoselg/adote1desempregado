export const cookieName = 'adote_session';
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production' && process.env.SESSION_COOKIE_SECURE !== 'false',
  sameSite: 'strict',
  path: '/',
};
export function sessionToken(req) {
  const cookie = (req.headers.cookie || '').split(';').map(part => part.trim())
    .find(part => part.startsWith(`${cookieName}=`));
  return cookie ? cookie.slice(cookieName.length + 1) : null;
}
export function allowBearer() {
  return process.env.NODE_ENV !== 'production';
}
export function requireSameOrigin(req, res, next) {
  if (process.env.NODE_ENV === 'production' || sessionToken(req)) {
    if (req.headers.origin !== process.env.FRONTEND_ORIGIN) {
      return res.status(403).json({ error: 'Origem da requisição não autorizada.' });
    }
  }
  next();
}
