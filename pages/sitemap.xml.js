export default function SiteMap() {}
export async function getServerSideProps({ res }) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://jagdlatein.de';
  const urls = [
    '', 'preise', 'login', 'quiz', 'quiz/run', 'glossar', 'impressum', 'datenschutz'
  ].map(p => `${base}/${p}`.replace(/\/+$/,'/'));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `<url><loc>${u}</loc></url>`).join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.write(xml);
  res.end();
  return { props: {} };
}
