import { requirePaidAccount } from "../../../../lib/account-access";
import { quizDatabase, quizFailure } from "../../../../lib/quiz-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

export async function GET(req) {
  try {
    const account = await requirePaidAccount(req);
    const { data, error } = await quizDatabase(account).from("verified_quiz_scores")
      .select("username,country,total_points").order("total_points", { ascending: false }).limit(100);
    if (error) throw error;
    return Response.json({ data: data || [] }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return quizFailure(error); }
}
