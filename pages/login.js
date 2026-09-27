import { useState } from 'react';
import { useRouter } from 'next/router';
import { getRole } from '../lib/auth';

export async function getServerSideProps({ req }) {
  const role = getRole(req);
  if (role) {
    return { redirect: { destination: '/', permanent: false } };
  }
  return { props: {} };
}

export default function Login() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    setLoading(false);
    if (res.ok) {
      router.push('/');
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Incorrect password');
    }
  }

  return (
    <div className="page login-box">
      <h1>Customer Service Records</h1>
      <p>Enter your team password to continue.</p>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Team password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Checking...' : 'Log In'}
        </button>
      </form>
    </div>
  );
}
