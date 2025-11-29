export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    url: process.env.SUPABASE_URL,
    role: process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10) + "...",
    anon: process.env.SUPABASE_ANON_KEY?.slice(0, 10) + "..."
  });
}
