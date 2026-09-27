import supabaseAdmin from '../../../lib/supabaseAdmin';
import { getRole } from '../../../lib/auth';

export default async function handler(req, res) {
  const role = getRole(req);
  if (!role) return res.status(401).json({ error: 'Not logged in' });

  if (req.method === 'GET') {
    const { search = '', status = '' } = req.query;

    let query = supabaseAdmin
      .from('units')
      .select('*')
      .order('updated_at', { ascending: false });

    if (search) {
      // Match on serial number OR customer name
      query = query.or(
        `serial_number.ilike.%${search}%,customer_name.ilike.%${search}%`
      );
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.limit(200);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ units: data });
  }

  if (req.method === 'POST') {
    if (role !== 'production') {
      return res.status(403).json({ error: 'Production access only' });
    }
    const { serial_number, customer_name } = req.body || {};
    if (!serial_number || !customer_name) {
      return res
        .status(400)
        .json({ error: 'Serial number and customer name are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('units')
      .insert({ serial_number, customer_name, status: 'Received' })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ unit: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
