// Only the page's getStaticProps imports this adapter. Never send legal texts,
// answers or the full regional datasets to the plan's client component.
import { getLegalDataset } from "./regional-law-data";
import { buildRegionalLawBundle } from "./regional-law-core";
import { examCountries } from "./exam-profile";
import { learningCategoryDetails } from "./learning-categories";

const officialKinds = new Set(["official-catalog", "official-sample", "exam-rules"]);
// Explicit issuer inventory, rather than treating every kind:"law" mirror as
// the issuer's original. Hessen's two LJV rehosts deliberately do not qualify.
const officialHosts = new Set([
  "www.fedlex.admin.ch", "www.zh.ch", "www.belex.sites.be.ch", "srl.lu.ch", "rechtsbuch.ur.ch", "www.sz.ch",
  "gdb.ow.ch", "gesetze.nw.ch", "gesetze.gl.ch", "bgs.zg.ch", "bdlf.fr.ch", "bgs.so.ch", "www.gesetzessammlung.bs.ch",
  "bl.clex.ch", "rechtsbuch.sh.ch", "ar.clex.ch", "ai.clex.ch", "www.gesetzessammlung.sg.ch", "www.gr-lex.gr.ch",
  "gesetzessammlungen.ag.ch", "www.rechtsbuch.tg.ch", "m3.ti.ch", "prestations.vd.ch", "lex.vs.ch", "rsn.ne.ch", "rsju.jura.ch",
  "www.gesetze-im-internet.de", "www.landesrecht-bw.de", "www.gesetze-bayern.de", "gesetze.berlin.de", "bravors.brandenburg.de",
  "www.transparenz.bremen.de", "www.rv.hessenrecht.hessen.de", "verkuendung.hessen.de", "rp-darmstadt.hessen.de",
  "www.landesrecht-mv.de", "www.ml.niedersachsen.de", "www.verkuendung-niedersachsen.de", "recht.nrw.de", "landesrecht.rlp.de",
  "recht.saarland.de", "revosax.sachsen.de", "www.landesrecht.sachsen-anhalt.de", "www.schleswig-holstein.de", "landesrecht.thueringen.de",
  "www.ris.bka.gv.at", "ris.bka.gv.at", "www.weu.be.ch", "lawa.lu.ch", "www.ur.ch", "www.gl.ch", "zg.ch", "www.fr.ch", "so.ch",
  "www.baselland.ch", "services.sh.ch", "ar.ch", "www.sg.ch", "www.gr.ch", "www.ag.ch", "jfv.tg.ch", "www.vd.ch", "www.ne.ch", "www.jura.ch",
  "www.lmg.bayern.de", "www.berlin.de", "rp-kassel.hessen.de", "www.mlv.nrw.de", "www.wald.sachsen.de", "www.schleswig-flensburg.de",
  "umwelt.thueringen.de", "was.thueringen.de", "www.kaerntner-jaegerschaft.at",
]);
export function isExamPlanOfficialUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return false;
    if (url.hostname === "www.juris.de") return url.pathname.startsWith("/bsha/");
    if (url.hostname === "silgeneve.ch") return url.pathname.startsWith("/legis/");
    return officialHosts.has(url.hostname);
  } catch { return false; }
}
function legalSummary(bundle, ownRegion) {
  const articles = bundle.articles.filter(article => article.regionCode === ownRegion);
  const seen = new Set();
  const sources = [];
  for (const article of articles) for (const source of article.sources) {
    if (source.kind !== "law" || !isExamPlanOfficialUrl(source.url)) continue;
    const key = `${source.url}\n${source.publisher}`;
    if (seen.has(key)) continue;
    seen.add(key);
    sources.push({ title: source.title, url: source.url, publisher: source.publisher, reviewedOn: article.reviewedOn });
  }
  return {
    articleCount: articles.length,
    reviewedArticleCount: articles.filter(article => article.learningReviewed).length,
    questionCount: bundle.questions.filter(question => question.regionCode === ownRegion).length,
    sources,
  };
}
function officialResources(region) {
  return region.examResources.filter(resource => officialKinds.has(resource.kind) && isExamPlanOfficialUrl(resource.url)).map(resource => ({ ...resource }));
}

export function getExamStudyPlanData({ asOf } = {}) {
  return {
    categories: learningCategoryDetails.map(category => ({ slug: category.slug, title: category.title, focus: [...category.focus] })),
    countries: examCountries.map(country => {
      const dataset = getLegalDataset(country.code);
      const federalBundle = buildRegionalLawBundle(dataset, "BUND", { includeFederal: false, asOf });
      const federal = federalBundle ? {
        ...legalSummary(federalBundle, "BUND"),
        name: federalBundle.region.name,
        lawTitle: federalBundle.region.lawTitle,
        officialUrl: federalBundle.region.officialUrl,
        examResources: officialResources(federalBundle.region),
      } : null;
      return {
        code: country.code,
        federal,
        regions: country.regions.map(region => {
          const bundle = buildRegionalLawBundle(dataset, region.code, { asOf });
          const own = legalSummary(bundle, region.code);
          return {
            code: region.code,
            name: region.name,
            ...own,
            totalArticleCount: bundle.articles.length,
            totalQuestionCount: bundle.questions.length,
            includesFederal: bundle.includesFederal,
            lawTitle: bundle.region.lawTitle,
            officialUrl: bundle.region.officialUrl,
            examResources: officialResources(bundle.region),
          };
        }),
      };
    }),
  };
}
