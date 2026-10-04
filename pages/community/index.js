import Community from "../../components/Community";
import { readRequestAccountSession } from "../../lib/account-access";
import { communityCategories } from "../../lib/community-catalog";

export function getServerSideProps({ req, res, query }) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  return { props: { signedIn: Boolean(readRequestAccountSession(req)), initialCategory: communityCategories.some(item => item.slug === query.category) ? query.category : "all", context: typeof query.thema === "string" ? query.thema.replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, 120) : "" } };
}
export default Community;
