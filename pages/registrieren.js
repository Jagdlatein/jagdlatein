import LoginPage from "./login";
import { isPayPalSandboxTestEnvironment } from "../lib/test-environment";

export async function getServerSideProps({ res }) {
  res?.setHeader("Cache-Control", "private, no-store, max-age=0");
  if (process.env.ACCOUNT_REGISTRATION_ENABLED !== "true") {
    return { redirect: { destination: "/login", permanent: false } };
  }
  return { props: { registration: true, allowRegistration: true, isTestMail: isPayPalSandboxTestEnvironment() } };
}

export default LoginPage;
