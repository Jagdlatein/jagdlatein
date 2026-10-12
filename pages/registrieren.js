import LoginPage from "./login";
import { getTestLoginMailMode } from "../lib/test-environment";
import { getNextUrl } from "../lib/login-destination";

export async function getServerSideProps({ res, query = {} }) {
  res?.setHeader("Cache-Control", "private, no-store, max-age=0");
  if (process.env.ACCOUNT_REGISTRATION_ENABLED !== "true") {
    const next = getNextUrl(query.next);
    return { redirect: { destination: `/login?next=${encodeURIComponent(next)}`, permanent: false } };
  }
  const testMailMode = getTestLoginMailMode();
  return { props: { registration: true, allowRegistration: true, isTestMail: testMailMode !== null, testMailMode } };
}

export default LoginPage;
