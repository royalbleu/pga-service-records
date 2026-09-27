import crypto from 'crypto';
import cookie from 'cookie';

const COOKIE_NAME = 'csr_session';

function sign(value) {
  const hmac = crypto
    .createHmac('sha256', process.env.SESSION_SECRET)
    .update(value)
    .digest('hex');
  return `${value}.${hmac}`;
}

function verify(signed) {
  if (!signed) return null;
  const idx = signed.lastIndexOf('.');
  if (idx === -1) return null;
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = crypto
    .createHmac('sha256', process.env.SESSION_SECRET)
    .update(value)
    .digest('hex');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return value; // the role string, e.g. "sales" or "production"
}

// Call from an API route after checking the submitted password.
export function setSessionCookie(res, role) {
  const signed = sign(role);
  res.setHeader(
    'Set-Cookie',
    cookie.serialize(COOKIE_NAME, signed, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    })
  );
}

export function clearSessionCookie(res) {
  res.setHeader(
    'Set-Cookie',
    cookie.serialize(COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    })
  );
}

// Call from any API route (or getServerSideProps) to find out who's asking.
// Returns 'sales', 'production', or null if not logged in.
export function getRole(req) {
  const cookies = cookie.parse(req.headers.cookie || '');
  return verify(cookies[COOKIE_NAME]);
}
