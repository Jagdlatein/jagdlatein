try {
  await prisma.$transaction(/* ... wie gehabt ... */);
  return res.status(200).json({ ok: true, imported: cleaned.length });
} catch (e) {
  console.error("UPSERT_ERROR", e);
  return res.status(500).json({
    error: "DB upsert failed",
    detail: String(e?.message || e),
    hint: "Ist das Model QuizQuestion gepusht? (npx prisma db push)"
  });
}
