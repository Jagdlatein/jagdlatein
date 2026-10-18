import Link from "next/link";
import Image from "next/image";
import AppIcon from "./AppIcon";
import LearningToolLayout from "./LearningToolLayout";
import { getLearningCategoryByTitle } from "../lib/learning-categories";
import { getRecentLearningModules } from "../lib/recent-learning";
import LearningCategoryMenu from "./LearningCategoryMenu";
import LearningSearch from "./LearningSearch";
import QuizLeagueEntry from "./QuizLeagueEntry";
import JagdakademiePromotion from "./JagdakademiePromotion";
import { LearningCover } from "./LearningPhoto";
import styles from "../styles/LearningOverview.module.css";

const countryNames = { DE: "Deutschland", AT: "Österreich", CH: "Schweiz" };

function CourseCards({ modules, covers, showCategory = false, directLessons = false }) {
  return <div className={directLessons ? styles.courseList : styles.moduleGrid}>{modules.map(module => <article key={module.id} className={`${styles.moduleCard}${directLessons ? ` ${styles.courseRow}` : ""}`}>
    {!directLessons && covers[module.coverIndex]?.coursePhotoUse && <LearningCover media={covers[module.coverIndex]} compact imageHref={`/kurse/${module.id}`} />}
    <Link href={`/kurse/${module.id}`} prefetch={false} className={styles.moduleLink}>
      <span className={styles.tags}>{showCategory && <span>{module.category}</span>}<span>{module.level}</span>{module.contentAddedOn && <span>Ergänzt: {new Intl.DateTimeFormat("de-CH", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date(`${module.contentAddedOn}T00:00:00Z`))}</span>}</span>
      <h3>{module.title}<AppIcon name="arrow-right" size={20} /></h3>
      <p className={styles.muted}>{module.description}</p>
      {getLearningCategoryByTitle(module.category)?.slug === "jagdrecht" && <p className={styles.countries}>{module.countries.map(item => countryNames[item] || item).join(" · ")}</p>}
      <p className={styles.moduleFacts}>{module.lessonCount} Lektionen · etwa {module.minutes} Minuten</p>
    </Link>
    {directLessons && module.topics?.length > 0 && <ol className={styles.lessonLinks} aria-label={`Lektionen: ${module.title}`}>
      {module.topics.map(topic => <li key={topic.href}><Link href={topic.href} prefetch={false}>{topic.title}<AppIcon name="arrow-right" size={16} /></Link></li>)}
    </ol>}
  </article>)}</div>;
}

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
    <LearningSearch category={categoryInfo?.slug || "all"} />
    {!categoryInfo && <nav className={styles.quietNav} aria-label="Deine Kurse">
      <Link href="/meine-kurse">Meine Kurse & Fortschritt<AppIcon name="arrow-right" size={17} /></Link>
      <Link href="/lernen/lernkarten">Lernkarten<AppIcon name="arrow-right" size={17} /></Link>
      <Link href="/kurse">Kursverzeichnis<AppIcon name="arrow-right" size={17} /></Link>
    </nav>}
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
      {(featuredResources.length > 0 || additionalResources.length > 0) && <nav className={styles.quietNav} aria-label="In dieser Kategorie">
        <a href="#learning-modules">Wissen lesen</a>
        <a href={featuredResources.length ? "#learning-featured" : "#learning-resources"}>Entdecken & anwenden</a>
      </nav>}
      <section id="learning-modules" className={styles.section} aria-labelledby="learning-modules-heading">
        <div className={styles.sectionHeading}><h2 id="learning-modules-heading">Wissen lesen</h2><p>{counts.modules} Kurse · {counts.lessons} Lektionen</p></div>
        <p className={styles.readingHint}>Wähle ein Thema oder springe direkt zur gewünschten Lektion.</p>
        <CourseCards modules={modules} covers={covers} directLessons />
      </section>
      <FeaturedLearning tools={featuredResources} media={featuredMedia} />
      {additionalResources.length > 0 && <section id="learning-resources" className={styles.section} aria-labelledby="learning-resources-heading">
        <h2 id="learning-resources-heading">Weitere Lernangebote</h2>
        <ul className={styles.resources}>{additionalResources.map(tool => <li key={tool.href}><Link href={tool.href}>
          <AppIcon name={tool.icon} size={26} /><span><strong>{tool.title}</strong><span>{tool.description}</span></span><AppIcon name="arrow-right" size={18} />
        </Link></li>)}</ul>
      </section>}
    </> : <details className={styles.directory}>
      <summary>Alle {counts.modules} Lerneinheiten im Überblick</summary>
      <div className={styles.directoryContent}><CourseCards modules={modules} covers={covers} showCategory /></div>
    </details>}
    {paths.length > 0 && <details className={styles.directory}>
      <summary>Mit einem Lernpfad beginnen</summary>
      <div className={styles.pathGrid}>{paths.map(path => <article key={path.id} className={styles.pathCard}>
        <h3>{path.title}</h3><p className={styles.muted}>{path.description}</p>
        <ol className={styles.pathModules}>{path.modules.map(module => <li key={module.id}><Link href={`/kurse/${module.id}`}>{module.title}</Link></li>)}</ol>
      </article>)}</div>
    </details>}
    {categoryInfo && <nav className={styles.quietNav} aria-label="Deine Kurse"><Link href="/meine-kurse">Meine Kurse & Fortschritt<AppIcon name="arrow-right" size={17} /></Link></nav>}
    {(!categoryInfo || categoryInfo.slug === "pruefung-sprache") && <JagdakademiePromotion />}
  </LearningToolLayout>;
}
