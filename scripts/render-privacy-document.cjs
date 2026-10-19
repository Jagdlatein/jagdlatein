const fs = require('node:fs');
const path = require('node:path');
const { createLoader, root, local } = require('./helpers/project-module.cjs');
const React = local('react');
const { renderToStaticMarkup } = local('react-dom/server');

const outputPath = path.join(root, 'public/datenschutzerklaerung.html');

// The regular page and this standalone HTML document share one reviewed text.
function renderPrivacyDocument() {
  const PrivacyPolicyContent = createLoader()('components/PrivacyPolicyContent.js').default;
  const content = renderToStaticMarkup(React.createElement(PrivacyPolicyContent, { mutedClassName: 'muted' }));
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Informationen zur Datenverarbeitung und deinen Rechten.">
<title>Datenschutzerklärung – Jagdlatein</title>
<style>
  :root { color-scheme: light; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #24231f; background: #fff; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: clamp(1rem, 4vw, 3rem); font-size: 1rem; line-height: 1.75; }
  main { width: 100%; max-width: 54rem; margin: 0 auto; overflow-wrap: anywhere; hyphens: auto; }
  h1 { font-size: clamp(1.8rem, 5vw, 2.5rem); line-height: 1.2; margin: 0 0 1rem; }
  h2 { font-size: 1.35rem; line-height: 1.35; margin: 2.25rem 0 .75rem; }
  h3 { font-size: 1.15rem; line-height: 1.4; margin: 1.5rem 0 .75rem; }
  p, ul, address { margin: .75rem 0; }
  ul { padding-left: 1.4rem; }
  li + li { margin-top: .75rem; }
  a { color: #4d421b; text-underline-offset: .15em; overflow-wrap: anywhere; }
  a:focus-visible { outline: 3px solid #9b7715; outline-offset: 3px; }
  .muted { color: #4c4c48; }
  @media print { body { padding: 0; } h2, h3 { break-after: avoid; } a { color: inherit; } }
</style>
</head>
<body>
<main>
<h1>Datenschutzerklärung</h1>
<p>Informationen zur Datenverarbeitung und deinen Rechten.</p>
<section aria-label="Datenschutzhinweise">${content}</section>
</main>
</body>
</html>
`;
}

if (require.main === module) {
  fs.writeFileSync(outputPath, renderPrivacyDocument(), 'utf8');
  console.log('Eigenständige Datenschutzerklärung erstellt: public/datenschutzerklaerung.html');
}

module.exports = { renderPrivacyDocument, outputPath };
