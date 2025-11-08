export default function handler(req, res) {
  const v = process.env.DATABASE_URL || "";
  res.json({
    startsWith_postgresql: v.startsWith("postgresql://"),
    value_prefix: v.slice(0, 24),   // nur zum Prüfen
    has_equal_sign_inside: v.includes("DATABASE_URL="),
    has_quotes: v.includes('"') || v.includes("'")
  });
}
