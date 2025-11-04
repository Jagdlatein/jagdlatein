export default function Robots() {}
export async function getServerSideProps({ res }) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://jagdlatein.de';
  const body = [
    'User-agent: *',
    'Allow: /',
    `Sitemap: ${base}/sitemap.xml`
  ].join('\n');

  res.setHeader('Content-Type', 'text/plain');
  res.write(body);
  res.end();
  return { props: {} };
}
