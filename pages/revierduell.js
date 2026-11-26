import RevierDuell from "../components/RevierDuell";
import { getDuellPageProps } from "../lib/revierduell-server";

export default function RevierDuellPage(props) {
  return <RevierDuell key={JSON.stringify([props.seed, props.target, props.revision, props.initialRawPath])} {...props} />;
}

export function getServerSideProps(context) {
  context.res.setHeader("Cache-Control", "private, no-store, max-age=0");
  return { props: { ...getDuellPageProps(context.query), initialRawPath: context.resolvedUrl,
    analyticsEnabled: process.env.REVIERDUELL_ANALYTICS_ENABLED === "true" } };
}
