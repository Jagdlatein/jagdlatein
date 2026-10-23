import RegionalLawLearning from "../../components/RegionalLawLearning";

export async function getStaticProps() {
  const { getLegalCountryMetadata } = await import("../../lib/regional-law-data");
  return { props: getLegalCountryMetadata("AT") };
}

export default function JagdrechtAT(props) {
  return <RegionalLawLearning {...props} />;
}
