import RegionalLawLearning from "../../components/RegionalLawLearning";

export async function getStaticProps() {
  const { getLegalCountryMetadata } = await import("../../lib/regional-law-data");
  return { props: getLegalCountryMetadata("DE") };
}

export default function JagdrechtDE(props) {
  return <RegionalLawLearning {...props} />;
}
