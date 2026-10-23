import DogBreedProfile from "../../../components/DogBreedProfile";

export async function getStaticPaths() {
  const { dogBreeds } = await import("../../../lib/dog-compass");
  return { paths: dogBreeds.map(profile => ({ params: { rasse: profile.id } })), fallback: false };
}

export async function getStaticProps({ params }) {
  const { dogBreeds, dogWorkTasks, dogCompassSources } = await import("../../../lib/dog-compass");
  const profile = typeof params?.rasse === "string" ? dogBreeds.find(profile => profile.id === params.rasse) : null;
  if (!profile) return { notFound: true };
  return { props: { profile, tasks: dogWorkTasks.filter(task => profile.tasks.includes(task.id)), contextSources: dogCompassSources } };
}

export default function DogBreedPage(props) {
  return <DogBreedProfile key={props.profile.id} {...props} />;
}
