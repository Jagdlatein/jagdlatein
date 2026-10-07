import { requirePaidAccount } from "../../../../lib/account-access";
import { quizDatabase, quizFailure } from "../../../../lib/quiz-api";
import { isAccountGenerationEnabled } from "../../../../lib/account-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

export async function GET(req) {
  try {
    const account = await requirePaidAccount(req);
    if (isAccountGenerationEnabled()) {
      const result = await quizDatabase(account).rpc("get_current_quiz_score", { p_email: account.email });
      if (result.error) throw result.error;
      return Response.json({ data: result.data || null }, { headers: { "Cache-Control": "private, no-store" } });
    }
    const { data, error } = await quizDatabase(account).from("verified_quiz_scores")
      .select("username,country,total_points,rounds,updated_at").eq("account_email", account.email).maybeSingle();
    if (error) throw error;
    return Response.json({ data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return quizFailure(error); }
}
