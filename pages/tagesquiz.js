import RevierMoment from "../components/RevierMoment";
import { getRevierMoment } from "../lib/revier-moment-server";

export default RevierMoment;

export function getServerSideProps({ res }) {
  res.setHeader("Cache-Control", "private, no-store");
  return { props: { moment: getRevierMoment() } };
}
