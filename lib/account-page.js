export function getAccountPageProps({ req, res, resolvedUrl }) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  if (req.cookies?.jl_session !== "1") {
    return {
      redirect: { destination: `/login?next=${encodeURIComponent(resolvedUrl)}`, permanent: false },
    };
  }
  return { props: {} };
}
