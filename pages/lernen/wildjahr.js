import WildYear from "../../components/WildYear";

export default WildYear;

export function currentWildYearMonth(date = new Date()) {
  return Number(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Zurich", month: "numeric",
  }).format(date));
}

export function getServerSideProps() {
  return { props: { currentMonth: currentWildYearMonth() } };
}
