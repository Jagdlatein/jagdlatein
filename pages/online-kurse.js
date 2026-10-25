import OnlineAcademy from '../components/OnlineAcademy';
import { getPaidPageProps } from '../lib/account-access';
import { getMyCourseCatalog } from '../lib/my-course-catalog';

export async function getServerSideProps(context) {
  const access = await getPaidPageProps(context);
  if (access.redirect) return access;
  return { props: { catalog: getMyCourseCatalog() } };
}
export default function OnlineCoursesPage(props) { return <OnlineAcademy {...props} />; }
