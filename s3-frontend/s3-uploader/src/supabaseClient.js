import { createClient } from '@supabase/supabase-js';

// IMPORTANT: use the ANON key on the frontend (safe).
export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);
