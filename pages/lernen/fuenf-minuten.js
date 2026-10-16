import DailyReview from "../../components/DailyReview";
import { getPackedDailyReviewCatalog } from "../../lib/daily-review-pool";
export default DailyReview;
export function getStaticProps() { return { props: { catalog: getPackedDailyReviewCatalog() } }; }
