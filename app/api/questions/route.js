import questions from "@/data/questions-full";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get("country") || "DE";
  const topic = searchParams.get("topic") || "Alle";

  const filtered = questions.filter(
    (q) =>
      (country === "Alle" || q.country === country) &&
      (topic === "Alle" || q.topic === topic)
  );

  return Response.json({ questions: filtered });
}
