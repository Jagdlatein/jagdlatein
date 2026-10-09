import LoginPage from "./login";
import { getTestLoginMailMode } from "../lib/test-environment";

export async function getServerSideProps({ res }) {
  res?.setHeader("Cache-Control", "private, no-store, max-age=0");
  if (process.env.ACCOUNT_REGISTRATION_ENABLED !== "true") {
    return { redirect: { destination: "/login", permanent: false } };
  }
  const testMailMode = getTestLoginMailMode();
  return { props: { registration: true, allowRegistration: true, isTestMail: testMailMode !== null, testMailMode } };
}

export default LoginPage;
