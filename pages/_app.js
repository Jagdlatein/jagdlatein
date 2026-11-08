import GlobalHomeButton from "../components/GlobalHomeButton";

import "../styles/AppBase.css";
import Head from "next/head";
import { useRouter } from "next/router";
import ExamProfileBoundary, { requiresExamProfile } from "../components/ExamProfileBoundary";
import UsageTelemetry from "../components/UsageTelemetry";

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const required = requiresExamProfile(router.pathname);
  return (
    <>
      <Head><link rel="manifest" href="/manifest.webmanifest" /><meta name="theme-color" content="#faf8f1" /></Head>
      <ExamProfileBoundary required={required}>
        <Component {...pageProps} />
        <UsageTelemetry pathname={router.isReady ? router.pathname : null} />
        {!Component.examProfileSetup && <GlobalHomeButton />}
      </ExamProfileBoundary>
    </>
  );
}
