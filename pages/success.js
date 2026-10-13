import { getNextUrl } from "../lib/login-destination";

// An old payment-return URL is not proof of a completed purchase. Reuse the
// current checkout's verified account status rather than promising access.
export function getServerSideProps({ res, query = {} }) {
  res?.setHeader("Cache-Control", "private, no-store, max-age=0");
  const destination = getNextUrl(query.next);
  const path = new URL(destination, "https://jagdlatein.invalid").pathname.replace(/\/+$/, "") || "/";
  const next = ["/", "/preise", "/success"].includes(path) ? "" : `?next=${encodeURIComponent(destination)}`;
  return { redirect: { destination: `/preise${next}`, permanent: false } };
}

export default function PaymentReturn() { return null; }
