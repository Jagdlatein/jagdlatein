import WildYear from "../../components/WildYear";
import { readWildYearSelection } from "../../lib/wild-year-selection";
import { wildYearSpecies } from "../../lib/wild-year";
import { getWildYearOverview } from "../../lib/wild-year-overview-server";

export default WildYear;

export function currentWildYearMonth(date = new Date()) {
  return Number(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Zurich", month: "numeric",
  }).format(date));
}

export function getServerSideProps({ query = {} } = {}) {
  const currentMonth = currentWildYearMonth();
  const initialSelection = readWildYearSelection(query, currentMonth);
  const monthly = wildYearSpecies.some(item => item.slug === initialSelection.slug);
  const annualOverview = initialSelection.slug && initialSelection.month && !monthly ? getWildYearOverview(initialSelection.slug) : null;
  return { props: { currentMonth, initialSelection, annualOverview } };
}
