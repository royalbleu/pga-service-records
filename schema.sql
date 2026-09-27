-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New Query -> paste -> Run).

create extension if not exists "pgcrypto";

create table if not exists units (
  id uuid primary key default gen_random_uuid(),
  serial_number text not null unique,
  customer_name text not null,
  status text not null default 'Received',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists service_records (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id) on delete cascade,

  date_received date,
  date_serviced date,
  serviced_by text,
  serviced_location text, -- 'USA' or 'Canada'

  -- Included items
  included_unit boolean default false,
  included_bag boolean default false,
  included_foams boolean default false,
  included_charger boolean default false,
  included_weight boolean default false,
  included_dump_cell boolean default false,

  -- Reason for return
  reason_recalibration boolean default false,
  reason_broken_temp boolean default false,
  reason_broken_ff boolean default false,
  reason_broken_scale boolean default false,
  reason_charging_issue boolean default false,
  reason_not_turning_on boolean default false,
  reason_inventory_return boolean default false,
  reason_other text,

  investigation text,

  -- Parts replaced
  parts_main_board boolean default false,
  parts_sensor_board boolean default false,
  parts_temp_sensor_only boolean default false,
  parts_lcd_screen boolean default false,
  parts_lithium_battery boolean default false,
  parts_clock_battery boolean default false,
  parts_power_button boolean default false,
  parts_charger_cable boolean default false,
  parts_printer boolean default false,

  -- Services done
  services_recalibration boolean default false,
  services_boot_update boolean default false,
  services_usb_calibrate boolean default false,
  services_other text,

  status_set text not null default 'Received', -- status of the unit as of this record
  created_at timestamptz not null default now()
);

create index if not exists idx_units_serial on units (serial_number);
create index if not exists idx_units_customer on units (customer_name);
create index if not exists idx_service_records_unit on service_records (unit_id);
