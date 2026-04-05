import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const APP_STATE_TABLE = "app_state";
const APP_STATE_ID = "casa-bravo-main";

export const remoteEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const supabase = remoteEnabled
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    })
  : null;

export const fetchRemoteAppState = async () => {
  if (!supabase) return { data: null, error: null };

  const { data, error } = await supabase
    .from(APP_STATE_TABLE)
    .select("customers, orders, audit_log, settings, updated_at")
    .eq("id", APP_STATE_ID)
    .maybeSingle();

  return { data, error };
};

export const saveRemoteAppState = async (payload) => {
  if (!supabase) return { data: null, error: null };

  const { data, error } = await supabase
    .from(APP_STATE_TABLE)
    .upsert(
      {
        id: APP_STATE_ID,
        customers: payload.customers,
        orders: payload.orders,
        audit_log: payload.auditLog,
        settings: payload.settings,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select("updated_at")
    .single();

  return { data, error };
};
