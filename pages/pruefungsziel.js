import ExamProfileWelcome from "../components/ExamProfileWelcome";
import { getNextUrl } from "../lib/login-destination";
import { getAccountPageProps } from "../lib/account-page";

export function getServerSideProps(context) {
  const result = getAccountPageProps(context);
  if (result.redirect) return result;
  const next = getNextUrl(context.query.next);
  return { props: { destination: new URL(next, "https://jagdlatein.invalid").pathname.replace(/\/+$/, "") === "/pruefungsziel" ? "/konto" : next } };
}
export default function ExamProfileSetupPage({ destination }) {
  return <ExamProfileWelcome destination={destination} />;
}
ExamProfileSetupPage.examProfileSetup = true;
