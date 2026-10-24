import WildYear from "../../components/WildYear";
import { readWildYearSelection } from "../../lib/wild-year-selection";

export default WildYear;

export function currentWildYearMonth(date = new Date()) {
  return Number(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Zurich", month: "numeric",
  }).format(date));
}

export function getServerSideProps({ query = {} } = {}) {
  const currentMonth = currentWildYearMonth();
  return { props: { currentMonth, initialSelection: readWildYearSelection(query, currentMonth) } };
}
