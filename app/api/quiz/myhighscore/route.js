import { requirePaidAccount } from "../../../../lib/account-access";
import { cleanQuizUsername, quizDatabase, quizFailure } from "../../../../lib/quiz-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

export async function GET(req) {
  try {
    await requirePaidAccount(req);
    const username = cleanQuizUsername(new URL(req.url).searchParams.get("username"));
    if (!username) return Response.json({ error: "Quizname fehlt oder ist ungültig." }, { status: 400 });
    const { data, error } = await quizDatabase().from("quiz_scores")
      .select("username,country,total_points,rounds,updated_at").eq("username", username).maybeSingle();
    if (error) throw error;
    return Response.json({ data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return quizFailure(error); }
}