import { requirePaidAccount } from "../../../../../lib/account-access";
import { quizFailure, readQuizBody } from "../../../../../lib/quiz-api";
import { quizId, requireQuizOrigin, rankedQuizRpc, roundResponse } from "../../../../../lib/ranked-quiz-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    requireQuizOrigin(req);
    const account = await requirePaidAccount(req);
    const body = await readQuizBody(req);
    return roundResponse(await rankedQuizRpc("advance_ranked_quiz", {
      p_email: account.email, p_round_id: quizId(body.roundId), p_request_id: quizId(body.requestId),
    }, account));
  } catch (error) { return quizFailure(error); }
}
