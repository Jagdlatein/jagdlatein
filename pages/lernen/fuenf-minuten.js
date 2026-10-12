import DailyReview from "../../components/DailyReview";
import { getDailyReviewCatalog } from "../../lib/daily-review-pool";
export default DailyReview;
export function getStaticProps() { return { props: { pool: getDailyReviewCatalog() } }; }
