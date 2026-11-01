import Link from "next/link";
import useExamProfile from "../lib/use-exam-profile";
import { examProfileLawHref, getExamProfileDetails } from "../lib/exam-profile";

// A read-only onward link: restoring/changing the examination preference never
// navigates, changes a media selection or writes quiz/profile state.
export default function MediaExamLawLink() {
  const { profile, ready } = useExamProfile();
  const details = ready === true ? getExamProfileDetails(profile) : null;
  return <Link href={details ? examProfileLawHref(profile) : "/lernen/jagdrecht"} prefetch={false}>
    {details ? `Rechtswissen: ${details.region.name} · ${details.country.name}` : "Rechtswissen nach Prüfungsregion"}
  </Link>;
}
