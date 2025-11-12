// /lib/adminGuard.js
import { cookies } from "next/headers";

export function requireAdmin() {
  const c = cookies().get("jl_admin");
  if (!c || c.value !== "1") {
    const e = new Error("Unauthorized");
    e.status = 401;
    throw e;
  }
}
