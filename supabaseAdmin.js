import { createClient } from '@supabase/supabase-js';

// This client uses the SERVICE ROLE key, which bypasses row-level security.
// It must only ever be imported from files under /pages/api — never from
// browser-facing components — so the key never reaches the client.
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

export default supabaseAdmin;
