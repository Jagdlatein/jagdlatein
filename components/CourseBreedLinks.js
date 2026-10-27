import Link from "next/link";
import { getCourseBreedLink } from "../lib/dog-breed-routing";

export default function CourseBreedLinks({ moduleId, lessonId }) {
  const link = getCourseBreedLink(moduleId, lessonId);
  if (!link) return null;
  return <nav aria-label="Rassenprofil" data-course-breed-links>
    <Link href={link.href} prefetch={false} data-course-breed={link.breedId} aria-label={`${link.name}: Rassenprofil`}>Rassenprofil</Link>
  </nav>;
}
