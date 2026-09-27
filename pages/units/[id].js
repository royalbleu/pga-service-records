import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getRole } from '../../lib/auth';
import supabaseAdmin from '../../lib/supabaseAdmin';

const STATUS_OPTIONS = [
  'Received',
  'In Diagnosis',
  'In Repair',
  'Fixed & Calibrated',
  'Ready for Customer Call',
  'Returned'
];

const REASON_FIELDS = [
  ['reason_recalibration', 'Recalibration (Maintenance / Inaccurate)'],
  ['reason_broken_temp', 'Broken temperature (Temp glitch / 0 Temp)'],
  ['reason_broken_ff', 'Broken FF/frequency (Freq over 20,000 / FF is high or unstable)'],
  ['reason_broken_scale', 'Broken scale (Unstable even after tube adjustment)'],
  ['reason_charging_issue', 'Charging issue'],
  ['reason_not_turning_on', 'Not turning on at all'],
  ['reason_inventory_return', 'Return for inventory (loaner / already sent replacement)']
];

const PARTS_FIELDS = [
  ['parts_main_board', 'Main board'],
  ['parts_sensor_board', 'Sensor board'],
  ['parts_temp_sensor_only', 'Temperature sensor only'],
  ['parts_lcd_screen', 'LCD screen'],
  ['parts_lithium_battery', '3pcs Lithium Battery'],
  ['parts_clock_battery', 'Clock battery'],
  ['parts_power_button', 'Power button'],
  ['parts_charger_cable', 'Charger cable'],
  ['parts_printer', 'Printer']
];

const SERVICES_FIELDS = [
  ['services_recalibration', 'Recalibration'],
  ['services_boot_update', 'Boot Update (blue color)'],
  ['services_usb_calibrate', 'USB -> Calibrate update (54 files)']
];

const INCLUDED_FIELDS = [
  ['included_unit', 'MA-405 unit'],
  ['included_bag', 'Bag'],
  ['included_foams', 'Foams'],
  ['included_charger', '5V Charger'],
  ['included_weight', '200g Weight'],
  ['included_dump_cell', 'Dump Cell']
];

function badgeClass(status) {
  return 'badge badge-' + status.toLowerCase().replace(/[^a-z]+/g, '-');
}

function labelsForTrue(record, fields) {
  return fields.filter(([key]) => record[key]).map(([, label]) => label);
}

export async function getServerSideProps({ req, params }) {
  const role = getRole(req);
  if (!role) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  const { data: unit } = await supabaseAdmin
    .from('units')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!unit) {
    return { notFound: true };
  }

  const { data: records } = await supabaseAdmin
    .from('service_records')
    .select('*')
    .eq('unit_id', params.id)
    .order('created_at', { ascending: false });

  return { props: { role, unit, records: records || [] } };
}

const emptyForm = {
  date_received: '',
  date_serviced: '',
  serviced_by: '',
  serviced_location: '',
  investigation: '',
  reason_other: '',
  services_other: '',
  status_set: 'Received'
};

export default function UnitDetail({ role, unit, records }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [checks, setChecks] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function toggle(key) {
    setChecks((c) => ({ ...c, [key]: !c[key] }));
  }

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const res = await fetch(`/api/units/${unit.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, ...checks })
    });
    setSaving(false);
    if (res.ok) {
      router.replace(router.asPath);
      setShowForm(false);
      setForm(emptyForm);
      setChecks({});
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Could not save record');
    }
  }

  return (
    <div className="page">
      <div className="topbar">
        <Link href="/">&larr; Back to search</Link>
      </div>

      <div className="card">
        <div className="unit-row">
          <div>
            <h2 style={{ margin: 0 }}>{unit.customer_name}</h2>
            <div className="meta">Serial: {unit.serial_number}</div>
          </div>
          <span className={badgeClass(unit.status)}>{unit.status}</span>
        </div>
      </div>

      {role === 'production' && (
        <div className="card">
          {!showForm ? (
            <button onClick={() => setShowForm(true)}>
              + Add Service Record
            </button>
          ) : (
            <form onSubmit={handleSubmit}>
              <h3>New Service Record</h3>

              <label>Date Received</label>
              <input
                type="date"
                value={form.date_received}
                onChange={(e) => updateField('date_received', e.target.value)}
              />
              <label>Date Serviced</label>
              <input
                type="date"
                value={form.date_serviced}
                onChange={(e) => updateField('date_serviced', e.target.value)}
              />
              <label>Serviced By</label>
              <input
                type="text"
                value={form.serviced_by}
                onChange={(e) => updateField('serviced_by', e.target.value)}
              />
              <label>Serviced Location</label>
              <select
                value={form.serviced_location}
                onChange={(e) =>
                  updateField('serviced_location', e.target.value)
                }
              >
                <option value="">-- Select --</option>
                <option value="USA">USA</option>
                <option value="Canada">Canada</option>
              </select>

              <fieldset>
                <legend>Included Items</legend>
                <div className="checkbox-grid">
                  {INCLUDED_FIELDS.map(([key, label]) => (
                    <label className="checkbox-item" key={key}>
                      <input
                        type="checkbox"
                        checked={!!checks[key]}
                        onChange={() => toggle(key)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend>Reason for Return</legend>
                <div className="checkbox-grid">
                  {REASON_FIELDS.map(([key, label]) => (
                    <label className="checkbox-item" key={key}>
                      <input
                        type="checkbox"
                        checked={!!checks[key]}
                        onChange={() => toggle(key)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <label>Other</label>
                <input
                  type="text"
                  value={form.reason_other}
                  onChange={(e) => updateField('reason_other', e.target.value)}
                />
              </fieldset>

              <fieldset>
                <legend>Investigation</legend>
                <textarea
                  value={form.investigation}
                  onChange={(e) =>
                    updateField('investigation', e.target.value)
                  }
                />
              </fieldset>

              <fieldset>
                <legend>Parts Replaced</legend>
                <div className="checkbox-grid">
                  {PARTS_FIELDS.map(([key, label]) => (
                    <label className="checkbox-item" key={key}>
                      <input
                        type="checkbox"
                        checked={!!checks[key]}
                        onChange={() => toggle(key)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend>Services Done</legend>
                <div className="checkbox-grid">
                  {SERVICES_FIELDS.map(([key, label]) => (
                    <label className="checkbox-item" key={key}>
                      <input
                        type="checkbox"
                        checked={!!checks[key]}
                        onChange={() => toggle(key)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <label>Other</label>
                <input
                  type="text"
                  value={form.services_other}
                  onChange={(e) =>
                    updateField('services_other', e.target.value)
                  }
                />
              </fieldset>

              <label>Set Tester Status</label>
              <select
                value={form.status_set}
                onChange={(e) => updateField('status_set', e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              {error && <p className="error-text">{error}</p>}

              <button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Record'}
              </button>{' '}
              <button
                type="button"
                className="secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      )}

      <h3>Service History</h3>
      {records.length === 0 && (
        <p style={{ color: '#666' }}>No service records yet.</p>
      )}
      {records.map((r) => {
        const reasons = labelsForTrue(r, REASON_FIELDS);
        const parts = labelsForTrue(r, PARTS_FIELDS);
        const services = labelsForTrue(r, SERVICES_FIELDS);
        return (
          <div className="card record-entry" key={r.id}>
            <h4>
              {r.date_serviced || r.date_received || 'Undated'} &mdash;{' '}
              {r.status_set}
            </h4>
            <div className="meta">
              Received: {r.date_received || '—'} | Serviced by:{' '}
              {r.serviced_by || '—'} ({r.serviced_location || '—'})
            </div>

            {reasons.length > 0 && (
              <>
                <strong>Reason for Return:</strong>
                <div className="tag-list">
                  {reasons.map((l) => (
                    <span className="tag" key={l}>
                      {l}
                    </span>
                  ))}
                </div>
              </>
            )}
            {r.reason_other && <p>Other reason: {r.reason_other}</p>}

            {r.investigation && (
              <>
                <strong>Investigation:</strong>
                <p>{r.investigation}</p>
              </>
            )}

            {parts.length > 0 && (
              <>
                <strong>Parts Replaced:</strong>
                <div className="tag-list">
                  {parts.map((l) => (
                    <span className="tag" key={l}>
                      {l}
                    </span>
                  ))}
                </div>
              </>
            )}

            {services.length > 0 && (
              <>
                <strong>Services Done:</strong>
                <div className="tag-list">
                  {services.map((l) => (
                    <span className="tag" key={l}>
                      {l}
                    </span>
                  ))}
                </div>
              </>
            )}
            {r.services_other && <p>Other service: {r.services_other}</p>}
          </div>
        );
      })}
    </div>
  );
}
