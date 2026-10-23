import Link from "next/link";
import Image from "next/image";
import AppIcon from "./AppIcon";
import LearningToolLayout from "./LearningToolLayout";
import { getRecentLearningModules } from "../lib/recent-learning";
import LearningCategoryMenu from "./LearningCategoryMenu";
import LearningTopicTree from "./LearningTopicTree";
import LearningSearch from "./LearningSearch";
import QuizLeagueEntry from "./QuizLeagueEntry";
import JagdakademiePromotion from "./JagdakademiePromotion";
import styles from "../styles/LearningOverview.module.css";

function FeaturedLearning({ tools, media }) {
  if (!tools.length) return null;
  return <section id="learning-featured" className={styles.section} aria-labelledby="learning-featured-heading">
    <h2 id="learning-featured-heading">Entdecken & anwenden</h2>
    <div className={styles.featuredGrid}>{tools.map(tool => {
      const photo = media[tool.href]?.purpose ? media[tool.href] : null;
      return <article className={styles.featuredCard} key={tool.href}>
        <Link href={tool.href} className={styles.featuredLink}>
          {photo && <Image src={photo.src} alt="" width={photo.width} height={photo.height} sizes="(max-width: 600px) 80px, 112px" className={styles.featuredPhoto} />}
          <span className={styles.featuredText}><strong>{tool.title}</strong><span>{tool.description}</span></span>
          <AppIcon name="arrow-right" size={20} />
        </Link>
        {photo && <small className={styles.featuredCredit}>{photo.credit} · Proportionale Vorschau · <a href={photo.creditUrl} target="_blank" rel="noreferrer">Quelle</a> · <a href={photo.licenseUrl} target="_blank" rel="noreferrer">Lizenz</a></small>}
      </article>;
    })}</div>
  </section>;
}

export default function LearningOverview({ data }) {
  const { modules, counts, paths: learningPaths, categoryCounts, categoryInfo, covers, categoryCovers, resources, featuredMedia = {} } = data;
  const modulesById = new Map(modules.map(module => [module.id, module]));
  const paths = learningPaths.map(path => ({ ...path, modules: path.moduleIds.map(id => modulesById.get(id)).filter(Boolean) }));
  const additionalResources = resources.filter(tool => !tool.featured);
  const featuredResources = resources.filter(tool => tool.featured);
  const recent = categoryInfo ? [] : getRecentLearningModules(modules);

  return <LearningToolLayout title={categoryInfo?.title || "Dein Lernbereich"} description={categoryInfo?.description || "Wissen nach Kategorien entdecken oder direkt nach einem Thema suchen."} icon={categoryInfo?.slug || "book"} category={categoryInfo?.slug} headingOnly stats={[]}>
    {!categoryInfo && <LearningCategoryMenu counts={categoryCounts} covers={covers} categoryCovers={categoryCovers} />}
    {!categoryInfo && <LearningSearch category="all" />}
    {recent.length > 0 && <section className={styles.section} aria-labelledby="learning-recent-heading">
      <h2 id="learning-recent-heading">Zuletzt ergänzt</h2>
      <ul className={styles.recentList}>{recent.map(module => <li key={module.id}>
        <Link href={`/kurse/${module.id}`}>
          <span><strong>{module.title}</strong><span>{module.category} · {module.lessonCount} Lektionen</span></span>
          <span className={styles.recentDate}><time dateTime={module.contentAddedOn}>{new Intl.DateTimeFormat("de-CH", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date(`${module.contentAddedOn}T00:00:00Z`))}</time><AppIcon name="arrow-right" size={19} /></span>
        </Link>
      </li>)}</ul>
    </section>}
    {!categoryInfo && <QuizLeagueEntry />}
    {categoryInfo ? <>
      <LearningTopicTree category={categoryInfo} groups={data.topicGroups} modules={modules} />
      <LearningSearch category={categoryInfo.slug} />
      {resources.length > 0 && <details className={styles.directory}>
      <summary>Videos, Stimmen und Übungen in dieser Kategorie</summary>
      <FeaturedLearning tools={featuredResources} media={featuredMedia} />
      {additionalResources.length > 0 && <section id="learning-resources" className={styles.section} aria-labelledby="learning-resources-heading">
        <h2 id="learning-resources-heading">Weitere Lernangebote</h2>
        <ul className={styles.resources}>{additionalResources.map(tool => <li key={tool.href}><Link href={tool.href}>
          <AppIcon name={tool.icon} size={26} /><span><strong>{tool.title}</strong><span>{tool.description}</span></span><AppIcon name="arrow-right" size={18} />
        </Link></li>)}</ul>
      </section>}
      </details>}
    </> : null}
    {!categoryInfo && paths.length > 0 && <details className={styles.directory}>
      <summary>Mit einem Lernpfad beginnen</summary>
      <div className={styles.pathGrid}>{paths.map(path => <article key={path.id} className={styles.pathCard}>
        <h3>{path.title}</h3><p className={styles.muted}>{path.description}</p>
        <ol className={styles.pathModules}>{path.modules.map(module => <li key={module.id}><Link href={`/kurse/${module.id}`}>{module.title}</Link></li>)}</ol>
      </article>)}</div>
    </details>}
    {(!categoryInfo || categoryInfo.slug === "pruefung-sprache") && <JagdakademiePromotion />}
  </LearningToolLayout>;
}
