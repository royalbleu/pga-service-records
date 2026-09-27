import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getRole } from '../lib/auth';

const STATUS_OPTIONS = [
  'Received',
  'In Diagnosis',
  'In Repair',
  'Fixed & Calibrated',
  'Ready for Customer Call',
  'Returned'
];

function badgeClass(status) {
  return 'badge badge-' + status.toLowerCase().replace(/[^a-z]+/g, '-');
}

export async function getServerSideProps({ req }) {
  const role = getRole(req);
  if (!role) {
    return { redirect: { destination: '/login', permanent: false } };
  }
  return { props: { role } };
}

export default function Dashboard({ role }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNewIntake, setShowNewIntake] = useState(false);
  const [newSerial, setNewSerial] = useState('');
  const [newCustomer, setNewCustomer] = useState('');
  const [createError, setCreateError] = useState('');

  const runSearch = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    const res = await fetch('/api/units?' + params.toString());
    if (res.ok) {
      const data = await res.json();
      setUnits(data.units);
    }
    setLoading(false);
  }, [search, status]);

  useEffect(() => {
    const t = setTimeout(runSearch, 250); // debounce typing
    return () => clearTimeout(t);
  }, [runSearch]);

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  }

  async function handleCreateUnit(e) {
    e.preventDefault();
    setCreateError('');
    if (!newSerial || !newCustomer) {
      setCreateError('Serial number and customer name are required');
      return;
    }
    const res = await fetch('/api/units', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serial_number: newSerial,
        customer_name: newCustomer
      })
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/units/${data.unit.id}`);
    } else {
      const data = await res.json().catch(() => ({}));
      setCreateError(data.error || 'Could not create unit');
    }
  }

  return (
    <div className="page">
      <div className="topbar">
        <h1>Customer Service Records</h1>
        <div>
          <span style={{ marginRight: 10, color: '#666' }}>
            {role === 'production' ? 'Production' : 'Sales'} view
          </span>
          <button className="secondary" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </div>

      <div className="card">
        <input
          type="text"
          placeholder="Search by serial number or customer name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {role === 'production' && (
        <div className="card">
          {!showNewIntake ? (
            <button onClick={() => setShowNewIntake(true)}>
              + New Intake
            </button>
          ) : (
            <form onSubmit={handleCreateUnit}>
              <h3>New Tester Intake</h3>
              <input
                type="text"
                placeholder="Serial number"
                value={newSerial}
                onChange={(e) => setNewSerial(e.target.value)}
              />
              <input
                type="text"
                placeholder="Customer name"
                value={newCustomer}
                onChange={(e) => setNewCustomer(e.target.value)}
              />
              {createError && <p className="error-text">{createError}</p>}
              <button type="submit">Create & Open</button>{' '}
              <button
                type="button"
                className="secondary"
                onClick={() => setShowNewIntake(false)}
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      )}

      {loading && <p>Searching...</p>}

      {!loading && units.length === 0 && (
        <p style={{ color: '#666' }}>No matching testers found.</p>
      )}

      {units.map((u) => (
        <Link
          key={u.id}
          href={`/units/${u.id}`}
          className="card"
          style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
        >
          <div className="unit-row">
            <div>
              <strong>{u.customer_name}</strong>
              <div className="meta">Serial: {u.serial_number}</div>
            </div>
            <span className={badgeClass(u.status)}>{u.status}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
