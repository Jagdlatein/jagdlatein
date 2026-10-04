import { getPaidPageProps } from "../../lib/account-access";
export default function AdminQuiz() { return null; }
export async function getServerSideProps(context) {
  const access = await getPaidPageProps(context, { adminOnly: true });
  if (access.redirect) return access;
  return { redirect: { destination: "/admin/import", permanent: false } };
}