import { readRequestAccountSession } from "./account-access";

export function getAccountPageProps({ req, res, resolvedUrl }) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  if (!readRequestAccountSession(req)) {
    return {
      redirect: { destination: `/login?next=${encodeURIComponent(resolvedUrl)}`, permanent: false },
    };
  }
  return { props: {} };
}
