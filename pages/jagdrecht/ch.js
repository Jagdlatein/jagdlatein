import RegionalLawLearning from "../../components/RegionalLawLearning";

export async function getStaticProps() {
  const { getLegalCountryMetadata } = await import("../../lib/regional-law-data");
  return { props: getLegalCountryMetadata("CH") };
}

export default function JagdrechtCH(props) {
  return <RegionalLawLearning {...props} />;
}
