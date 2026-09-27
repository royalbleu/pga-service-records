import supabaseAdmin from '../../../lib/supabaseAdmin';
import { getRole } from '../../../lib/auth';

const STATUS_OPTIONS = [
  'Received',
  'In Diagnosis',
  'In Repair',
  'Fixed & Calibrated',
  'Ready for Customer Call',
  'Returned'
];

export default async function handler(req, res) {
  const role = getRole(req);
  if (!role) return res.status(401).json({ error: 'Not logged in' });

  const { id } = req.query;

  if (req.method === 'GET') {
    const { data: unit, error: unitError } = await supabaseAdmin
      .from('units')
      .select('*')
      .eq('id', id)
      .single();
    if (unitError) return res.status(404).json({ error: 'Unit not found' });

    const { data: records, error: recError } = await supabaseAdmin
      .from('service_records')
      .select('*')
      .eq('unit_id', id)
      .order('created_at', { ascending: false });
    if (recError) return res.status(500).json({ error: recError.message });

    return res.status(200).json({ unit, records });
  }

  if (req.method === 'POST') {
    // Add a new service record entry, and update the unit's current status.
    if (role !== 'production') {
      return res.status(403).json({ error: 'Production access only' });
    }

    const body = req.body || {};
    const status_set = STATUS_OPTIONS.includes(body.status_set)
      ? body.status_set
      : 'Received';

    const record = {
      unit_id: id,
      date_received: body.date_received || null,
      date_serviced: body.date_serviced || null,
      serviced_by: body.serviced_by || null,
      serviced_location: body.serviced_location || null,

      included_unit: !!body.included_unit,
      included_bag: !!body.included_bag,
      included_foams: !!body.included_foams,
      included_charger: !!body.included_charger,
      included_weight: !!body.included_weight,
      included_dump_cell: !!body.included_dump_cell,

      reason_recalibration: !!body.reason_recalibration,
      reason_broken_temp: !!body.reason_broken_temp,
      reason_broken_ff: !!body.reason_broken_ff,
      reason_broken_scale: !!body.reason_broken_scale,
      reason_charging_issue: !!body.reason_charging_issue,
      reason_not_turning_on: !!body.reason_not_turning_on,
      reason_inventory_return: !!body.reason_inventory_return,
      reason_other: body.reason_other || null,

      investigation: body.investigation || null,

      parts_main_board: !!body.parts_main_board,
      parts_sensor_board: !!body.parts_sensor_board,
      parts_temp_sensor_only: !!body.parts_temp_sensor_only,
      parts_lcd_screen: !!body.parts_lcd_screen,
      parts_lithium_battery: !!body.parts_lithium_battery,
      parts_clock_battery: !!body.parts_clock_battery,
      parts_power_button: !!body.parts_power_button,
      parts_charger_cable: !!body.parts_charger_cable,
      parts_printer: !!body.parts_printer,

      services_recalibration: !!body.services_recalibration,
      services_boot_update: !!body.services_boot_update,
      services_usb_calibrate: !!body.services_usb_calibrate,
      services_other: body.services_other || null,

      status_set
    };

    const { data: newRecord, error: insertError } = await supabaseAdmin
      .from('service_records')
      .insert(record)
      .select()
      .single();
    if (insertError)
      return res.status(500).json({ error: insertError.message });

    const { error: updateError } = await supabaseAdmin
      .from('units')
      .update({ status: status_set, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (updateError)
      return res.status(500).json({ error: updateError.message });

    return res.status(201).json({ record: newRecord });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
