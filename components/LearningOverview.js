import Link from "next/link";
import AppIcon from "./AppIcon";
import LearningToolLayout from "./LearningToolLayout";
import { getLearningCategoryByTitle } from "../lib/learning-categories";
import LearningCategoryMenu from "./LearningCategoryMenu";
import LearningSearch from "./LearningSearch";
import { learningTools, legalLearningHubs } from "../lib/learning-tool-catalog";
import { learningExperiences } from "../lib/learning-experiences";
import { getLearningMedia } from "../lib/learning-media";
import { LearningCover } from "./LearningMedia";
import styles from "../styles/LearningOverview.module.css";

const countryNames = { DE: "Deutschland", AT: "Österreich", CH: "Schweiz" };

function CourseCards({ modules }) {
  return <div className={styles.moduleGrid}>{modules.map(module => <article key={module.id} className={styles.moduleCard}>
    <LearningCover media={getLearningMedia(module)} compact />
    <Link href={`/kurse/${module.id}`} className={styles.moduleLink}>
      <span className={styles.tags}><span>{module.category}</span><span>{module.level}</span></span>
      <h3>{module.title}<AppIcon name="arrow-right" size={20} /></h3>
      <p className={styles.muted}>{module.description}</p>
      {getLearningCategoryByTitle(module.category)?.slug === "jagdrecht" && <p className={styles.countries}>{module.countries.map(item => countryNames[item] || item).join(" · ")}</p>}
      <p className={styles.moduleFacts}>{module.lessonCount} Lektionen · {module.questionCount} Fragen · etwa {module.minutes} Minuten</p>
      <ul className={styles.lessonPreview}>{module.lessonTitles.slice(0, 3).map(title => <li key={title}>{title}</li>)}</ul>
    </Link>
  </article>)}</div>;
}

export default function LearningOverview({ data }) {
  const { modules, counts, paths: learningPaths, categoryCounts, categoryInfo } = data;
  const paths = learningPaths.filter(path => !categoryInfo || path.advanced).map(path => ({ ...path, modules: path.moduleIds.map(id => modules.find(module => module.id === id)).filter(Boolean) })).filter(path => path.modules.length);
  const resources = categoryInfo ? [...learningExperiences, ...learningTools, ...(categoryInfo.slug === "jagdrecht" ? legalLearningHubs : [])]
    .filter(tool => tool.categories.includes(categoryInfo.slug))
    .filter((tool, index, all) => all.findIndex(item => item.href === tool.href) === index) : [];

  return <LearningToolLayout title={categoryInfo?.title || "Dein Lernbereich"} description={categoryInfo?.description || "Wissen nach Kategorien entdecken oder direkt nach einem Thema suchen."} icon={categoryInfo?.slug || "book"} category={categoryInfo?.slug} headingOnly stats={[]}>
    {!categoryInfo && <LearningCategoryMenu counts={categoryCounts} />}
    <LearningSearch category={categoryInfo?.slug || "all"} />
    <nav className={styles.quietNav} aria-label="Deine Kurse">
      <Link href="/meine-kurse">Meine Kurse & Fortschritt<AppIcon name="arrow-right" size={17} /></Link>
      <Link href="/kurse">Kursverzeichnis<AppIcon name="arrow-right" size={17} /></Link>
    </nav>
    {categoryInfo ? <>
      <section className={styles.section} aria-labelledby="learning-modules-heading">
        <div className={styles.sectionHeading}><h2 id="learning-modules-heading">Lerneinheiten</h2><p>{counts.modules} Kurse · {counts.lessons} Lektionen · {counts.questions} Übungsfragen</p></div>
        <CourseCards modules={modules} />
      </section>
      {resources.length > 0 && <section className={styles.section} aria-labelledby="learning-resources-heading">
        <h2 id="learning-resources-heading">Entdecken & anwenden</h2>
        <ul className={styles.resources}>{resources.map(tool => <li key={tool.href}><Link href={tool.href}>
          <AppIcon name={tool.icon} size={26} /><span><strong>{tool.title}</strong><span>{tool.description}</span></span><AppIcon name="arrow-right" size={18} />
        </Link></li>)}</ul>
      </section>}
    </> : <details className={styles.directory}>
      <summary>Alle {counts.modules} Lerneinheiten im Überblick</summary>
      <div className={styles.directoryContent}><CourseCards modules={modules} /></div>
    </details>}
    {paths.length > 0 && <details className={styles.directory}>
      <summary>Mit einem Lernpfad beginnen</summary>
      <div className={styles.pathGrid}>{paths.map(path => <article key={path.id} className={styles.pathCard}>
        <h3>{path.title}</h3><p className={styles.muted}>{path.description}</p>
        <ol className={styles.pathModules}>{path.modules.map(module => <li key={module.id}><Link href={`/kurse/${module.id}`}>{module.title}</Link></li>)}</ol>
      </article>)}</div>
    </details>}
  </LearningToolLayout>;
}
