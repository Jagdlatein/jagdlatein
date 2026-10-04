export function getServerSideProps() {
  return { redirect: { destination: "/login?next=%2Fadmin", permanent: false } };
}

export default function AdminAuthPage() { return null; }
