import { requirePaidAccount } from "../../../../lib/account-access";
import { quizDatabase, quizFailure } from "../../../../lib/quiz-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

export async function GET(req) {
  try {
    const account = await requirePaidAccount(req);
    const { data, error } = await quizDatabase().from("verified_quiz_scores")
      .select("username,country,total_points,rounds,updated_at").eq("account_email", account.email).maybeSingle();
    if (error) throw error;
    return Response.json({ data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return quizFailure(error); }
}
