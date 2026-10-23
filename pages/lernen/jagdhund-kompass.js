import DogCompass from "../../components/DogCompass";
import { legacyDogBreedTarget } from "../../lib/dog-breed-routing";

export async function getServerSideProps({ query }) {
  const { dogBreeds } = await import("../../lib/dog-compass");
  return { redirect: { destination: legacyDogBreedTarget(query, dogBreeds), permanent: false } };
}

export default function DogCompassPage() {
  return <DogCompass />;
}
