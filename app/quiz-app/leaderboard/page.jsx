import { Suspense } from "react";
import LeaderboardClient from "./LeaderboardClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Lade Rangliste…</div>}>
      <LeaderboardClient />
    </Suspense>
  );
}
