export function getServerSideProps() {
  return { redirect: { destination: "/login?next=%2Fadmin%2Fglossar", permanent: false } };
}

export default function AdminLoginPage() { return null; }
