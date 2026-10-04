import { requirePaidAccount } from "../../../../lib/account-access";
import { quizFailure, readQuizBody } from "../../../../lib/quiz-api";
import { quizId, requireQuizOrigin, roundQuestions, rankedQuizRpc, roundResponse } from "../../../../lib/ranked-quiz-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const account = await requirePaidAccount(req);
    const id = quizId(new URL(req.url).searchParams.get("roundId"));
    return roundResponse(await rankedQuizRpc("read_ranked_quiz", { p_email: account.email, p_round_id: id }));
  } catch (error) { return quizFailure(error); }
}

export async function POST(req) {
  try {
    requireQuizOrigin(req);
    const account = await requirePaidAccount(req);
    const body = await readQuizBody(req);
    const id = quizId(body.requestId);
    const questions = roundQuestions(body.country, body.topic);
    return roundResponse(await rankedQuizRpc("start_ranked_quiz", {
      p_email: account.email, p_round_id: id, p_country: body.country, p_topic: body.topic, p_questions: questions,
    }));
  } catch (error) { return quizFailure(error); }
}
