import Community from "../../components/Community";
import { getAccountPageProps } from "../../lib/account-page";

export function getServerSideProps(context) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(context.params.id)) return { notFound: true };
  const access = getAccountPageProps(context);
  if (!access.props) return access;
  return { props: { signedIn: true, threadId: context.params.id } };
}
export default Community;
