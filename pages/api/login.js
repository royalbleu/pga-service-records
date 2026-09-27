import { setSessionCookie } from '../../lib/auth';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body || {};

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  if (password === process.env.PRODUCTION_PASSWORD) {
    setSessionCookie(res, 'production');
    return res.status(200).json({ role: 'production' });
  }

  if (password === process.env.SALES_PASSWORD) {
    setSessionCookie(res, 'sales');
    return res.status(200).json({ role: 'sales' });
  }

  return res.status(401).json({ error: 'Incorrect password' });
}
