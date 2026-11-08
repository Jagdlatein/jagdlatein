import RevierMoment from "../components/RevierMoment";
import { getRevierMoment } from "../lib/revier-moment-server";
import { getPaidPageProps } from "../lib/account-access";

export default RevierMoment;

export async function getServerSideProps(context) {
  const access = await getPaidPageProps(context);
  if (!access.props) return access;
  return { props: { moment: getRevierMoment() } };
}
