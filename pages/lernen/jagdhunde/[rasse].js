import DogBreedProfile from "../../../components/DogBreedProfile";
import { getDogBreedKnowledgeAssignment } from "../../../lib/dog-breed-routing";

export async function getStaticPaths() {
  const { dogBreeds } = await import("../../../lib/dog-compass");
  return { paths: dogBreeds.map(profile => ({ params: { rasse: profile.id } })), fallback: false };
}

export async function getStaticProps({ params }) {
  const { dogBreeds, dogWorkTasks, dogCompassSources } = await import("../../../lib/dog-compass");
  const profile = typeof params?.rasse === "string" ? dogBreeds.find(profile => profile.id === params.rasse) : null;
  if (!profile) return { notFound: true };
  const props = { profile, tasks: dogWorkTasks.filter(task => profile.tasks.includes(task.id)), contextSources: dogCompassSources };
  // Exact editorial assignments, independent of a fuzzy breed-name match.
  const assignment = getDogBreedKnowledgeAssignment(profile.id);
  if (assignment) {
    const { default: dataset } = await import("../../../data/learning-dog-genetics-2026-10-24.json");
    const module = dataset.modules.find(item => item.id === assignment.courseId);
    if (!module?.lessons.some(lesson => lesson.id === assignment.lessonId)) throw new Error(`Fehlende Genetik-Lektion für ${profile.id}`);
    props.healthKnowledge = {
      breedId: profile.id,
      courseId: module.id,
      reviewedOn: dataset.reviewedOn,
      scope: module.sourceReview.scope,
      limitations: module.sourceReview.limitations,
      sources: module.sources.map(({ label, url, organization }) => ({ label, url, organization })),
      lessons: module.lessons.map(lesson => {
        const record = dataset.evidence.find(item => item.moduleId === module.id && item.lessonId === lesson.id);
        if (!record?.claims?.length) throw new Error(`Fehlende Belegzuordnung für ${module.id}/${lesson.id}`);
        return { id: lesson.id, title: lesson.title, paragraphs: lesson.paragraphs, takeaway: lesson.takeaway,
          evidence: record.claims.map(({ claim, sourceUrls }) => ({ claim, sourceUrls })) };
      }),
    };
  }
  // Questions, options, answer keys and all other courses stay on the server.
  return { props };
}

export default function DogBreedPage(props) {
  return <DogBreedProfile key={props.profile.id} {...props} />;
}
