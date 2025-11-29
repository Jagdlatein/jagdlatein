export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    // Mit RPC Funktion laden
    const { data: rows, error } = await supabase.rpc("get_week_scores");

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data: rows });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
