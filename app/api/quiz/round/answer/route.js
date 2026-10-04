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
    if (typeof body.questionId !== "string" || body.questionId.length > 200 || !body.questionId ||
      (body.answerId !== null && (typeof body.answerId !== "string" || !body.answerId || body.answerId.length > 100))) {
      throw Object.assign(new Error("Ungültige Antwort."), { status: 400 });
    }
    return roundResponse(await rankedQuizRpc("answer_ranked_quiz", {
      p_email: account.email, p_round_id: quizId(body.roundId), p_question_id: body.questionId,
      p_answer_id: body.answerId, p_request_id: quizId(body.requestId),
    }));
  } catch (error) { return quizFailure(error); }
}
