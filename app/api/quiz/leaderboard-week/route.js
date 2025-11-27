export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  const query = `
    select
      user_id,
      username,
      max(points) as weekly_highscore
    from quiz_results
    where created_at >= date_trunc('week', now())
    group by user_id, username
    order by weekly_highscore desc;
  `;

  const { data, error } = await supabase.rpc("exec_sql", { sql: query });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}
