import { requirePaidAccount } from "../../../../lib/account-access";
import { cleanQuizUsername, LEAGUE_COUNTRIES, quizDatabase, quizFailure, readQuizBody } from "../../../../lib/quiz-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    await requirePaidAccount(req);
    const body = await readQuizBody(req);
    const username = cleanQuizUsername(body.username);
    const country = typeof body.country === "string" ? body.country.trim().toUpperCase() : "DE";
    if (!username || !LEAGUE_COUNTRIES.has(country)) {
      return Response.json({ success: false, error: "Bitte einen Quiznamen (maximal 40 Zeichen) und ein gültiges Land angeben." }, { status: 400 });
    }
    const database = quizDatabase();
    const { data, error } = await database.from("quiz_users").select("username").eq("username", username).maybeSingle();
    if (error) throw error;
    if (data) return Response.json({ success: true, exists: true });
    const { error: insertError } = await database.from("quiz_users").insert({ username, country, total_points: 0, rounds: 0 });
    if (insertError) {
      // Ein paralleler Start kann denselben Namen bereits angelegt haben.
      if (insertError.code === "23505") return Response.json({ success: true, exists: true });
      throw insertError;
    }
    return Response.json({ success: true, created: true });
  } catch (error) { return quizFailure(error); }
}