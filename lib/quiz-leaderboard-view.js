// Only these public fields reach the table. Account details from an unexpected
// response are never copied into its view model.
export function quizLeaderboardRows(value) {
  if (!Array.isArray(value) || value.length > 100) throw new Error("Ungültige Rangliste.");
  const names = new Set();
  const rows = value.map(row => {
    if (!row || Array.isArray(row) || typeof row !== "object"
      || typeof row.username !== "string" || row.username.trim().length < 1 || row.username.length > 40
      || /[\u0000-\u001f\u007f]/.test(row.username)
      || typeof row.country !== "string" || !/^[A-Z]{2}$/.test(row.country)
      || !Number.isSafeInteger(row.total_points) || row.total_points < 0
      || names.has(row.username)) throw new Error("Ungültige Rangliste.");
    names.add(row.username);
    return { username: row.username, country: row.country, points: row.total_points };
  }).sort((left, right) => right.points - left.points || left.username.localeCompare(right.username, "de"));
  let rank = 0;
  return rows.map((row, index) => {
    if (index === 0 || row.points !== rows[index - 1].points) rank = index + 1;
    return { ...row, rank, displayName: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.username) ? "Quizname verborgen" : row.username };
  });
}
