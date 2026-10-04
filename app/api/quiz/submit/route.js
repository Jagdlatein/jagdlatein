import { requirePaidAccount } from "../../../../lib/account-access";
import { cleanQuizUsername, quizDatabase, quizFailure, readQuizBody } from "../../../../lib/quiz-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    await requirePaidAccount(req);
    const body = await readQuizBody(req);
    const username = cleanQuizUsername(body.username);
    const points = body.points;
    if (!username || !Number.isInteger(points) || points < 0 || points > 4000) {
      return Response.json({ success: false, error: "Quizname oder Punkte sind ungültig." }, { status: 400 });
    }
    const database = quizDatabase();
    const { data: user, error: userError } = await database.from("quiz_users").select("country").eq("username", username).maybeSingle();
    if (userError) throw userError;
    if (!user) return Response.json({ success: false, error: "Bitte zuerst deinen Quiznamen registrieren." }, { status: 400 });
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const { data: existing, error: scoreError } = await database.from("quiz_scores").select("total_points,rounds").eq("username", username).maybeSingle();
      if (scoreError) throw scoreError;
      const oldScore = Number(existing?.total_points) || 0;
      if (existing && points <= oldScore) {
        return Response.json({ success: true, highscore: false, newScore: points, oldScore }, { headers: { "Cache-Control": "private, no-store" } });
      }
      const record = { username, country: user.country, total_points: points,
        rounds: (Number(existing?.rounds) || 0) + 1, updated_at: new Date().toISOString() };
      const result = existing
        ? await database.from("quiz_scores").update(record).eq("username", username).eq("total_points", oldScore).select("total_points").maybeSingle()
        : await database.from("quiz_scores").insert(record).select("total_points").maybeSingle();
      if (result.error && result.error.code !== "23505") throw result.error;
      if (!result.error && result.data) {
        return Response.json({ success: true, highscore: true, newScore: points, oldScore }, { headers: { "Cache-Control": "private, no-store" } });
      }
      // Ein anderer Lauf hat den Datensatz zwischen Lesen und Schreiben geändert.
    }
    throw Object.assign(new Error("Die Rangliste wird gerade aktualisiert. Bitte erneut speichern."), { status: 503 });
  } catch (error) { return quizFailure(error); }
}
