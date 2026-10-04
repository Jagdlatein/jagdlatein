// /lib/adminGuard.js
import { cookies } from "next/headers";
import { getSignedAccountAccess } from "./account-access";

export async function requireAdmin() {
  const access = await getSignedAccountAccess({ cookies: await cookies() }, { refresh: true });
  if (!access?.admin) {
    const e = new Error("Unauthorized");
    e.status = 401;
    throw e;
  }
}
