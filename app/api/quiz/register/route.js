import { requirePaidAccount } from "../../../../lib/account-access";
import { cleanQuizUsername, LEAGUE_COUNTRIES, quizDatabase, quizFailure, readQuizBody } from "../../../../lib/quiz-api";
import { rankedQuizRpc, requireQuizOrigin } from "../../../../lib/ranked-quiz-server";
import { isAccountGenerationEnabled } from "../../../../lib/account-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const account = await requirePaidAccount(req);
    if (isAccountGenerationEnabled()) {
      const result = await quizDatabase(account).rpc("get_current_quiz_identity", { p_email: account.email });
      if (result.error) throw result.error;
      return Response.json({ success: true, identity: result.data || null }, { headers: { "Cache-Control": "private, no-store" } });
    }
    const { data, error } = await quizDatabase(account).from("quiz_identities")
      .select("username,country").eq("account_email", account.email).maybeSingle();
    if (error) throw error;
    return Response.json({ success: true, identity: data || null }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return quizFailure(error); }
}

export async function POST(req) {
  try {
    requireQuizOrigin(req);
    const account = await requirePaidAccount(req);
    const body = await readQuizBody(req);
    const username = cleanQuizUsername(body.username);
    const country = typeof body.country === "string" ? body.country.trim().toUpperCase() : "DE";
    if (!username || !LEAGUE_COUNTRIES.has(country)) {
      return Response.json({ success: false, error: "Bitte einen Quiznamen (maximal 40 Zeichen) und ein gültiges Land angeben." }, { status: 400 });
    }
    const identity = await rankedQuizRpc("register_ranked_quiz", { p_email: account.email, p_username: username, p_country: country }, account);
    return Response.json({ success: true, ...identity }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return quizFailure(error); }
}
