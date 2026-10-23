import { useEffect, useRef, useState } from "react";
import Router from "next/router";
import PageMenu, { openPageMenu, closePageMenu } from "./PageMenu";
import styles from "../styles/TopicSectionReader.module.css";

export function resolveTopicSection(groups, hash, rootId = "themenbaum") {
  let id;
  try { id = typeof hash === "string" && hash.startsWith("#") ? decodeURIComponent(hash.slice(1)) : ""; }
  catch { return { kind: "root" }; }
  if (!id || id === rootId) return { kind: "root" };
  for (const group of groups) {
    if (id === group.id || group.aliases?.includes(id)) return { kind: "group", group };
    const topic = group.topics.find(topic => id === topic.id || topic.aliases?.includes(id));
    if (topic) return { kind: "topic", group, topic };
  }
  return { kind: "root" };
}

const hashLink = id => `#${encodeURIComponent(id)}`;

// Native fragment links provide normal Back/Forward, sharing, and new-tab use.
// Only the chosen renderer runs; the rest is neither hidden DOM nor a text dump.
export default function TopicSectionReader({ id = "themenbaum", title = "Themen wählen", groups, menuFooter }) {
  const [hash, setHash] = useState("");
  const focusTarget = useRef(null);
  const previousHash = useRef(null);
  const focusAfterNavigation = useRef(null);
  const currentGroups = useRef(groups);
  currentGroups.current = groups;
  const available = groups.filter(group => group.topics.length > 0);
  const view = resolveTopicSection(available, hash, id);

  useEffect(() => {
    if (typeof window === "undefined") return;
    function readHash() {
      const next = window.location.hash || "";
      if (next === previousHash.current) return;
      const initialized = previousHash.current !== null;
      previousHash.current = next;
      const target = resolveTopicSection(currentGroups.current, next, id);
      focusAfterNavigation.current = target.kind !== "root" || (initialized && (!next || next === hashLink(id))) ? next : null;
      setHash(next);
    }
    readHash();
    window.addEventListener("hashchange", readHash);
    window.addEventListener("popstate", readHash);
    window.addEventListener("pageshow", readHash);
    Router.events?.on("hashChangeComplete", readHash);
    Router.events?.on("routeChangeComplete", readHash);
    return () => {
      window.removeEventListener("hashchange", readHash);
      window.removeEventListener("popstate", readHash);
      window.removeEventListener("pageshow", readHash);
      Router.events?.off("hashChangeComplete", readHash);
      Router.events?.off("routeChangeComplete", readHash);
    };
  }, [id]);

  useEffect(() => {
    if (view.kind !== "topic") {
      const timer = setTimeout(() => openPageMenu(`${id}-choices`), 0);
      return () => clearTimeout(timer);
    }
    closePageMenu();
    if (focusAfterNavigation.current !== hash || !focusTarget.current) return;
    focusAfterNavigation.current = null;
    focusTarget.current.focus({ preventScroll: true });
    focusTarget.current.scrollIntoView({ block: "start", behavior: "auto" });
  }, [hash, id]);

  return <section id={id} className={styles.reader} aria-label={title}>
    <PageMenu title={title}>
      <div id={`${id}-choices`} tabIndex={-1}>
      {view.kind !== "root" && <a className={styles.link} href={hashLink(id)}>Alle Unterkategorien</a>}
      {view.kind !== "root" ? <>
      <h3 className={styles.menuHeading}>{view.group.title}</h3>
      <ol className={styles.list} aria-label={`${view.group.title}: Themen`}>
        {view.group.topics.map(topic => <li key={topic.id}><a className={styles.link} href={hashLink(topic.id)}><span>{topic.title}</span><span aria-hidden="true">→</span></a></li>)}
      </ol></> : <ul className={styles.list} aria-label="Unterkategorien">
        {available.map(group => <li key={group.id}><a className={styles.link} href={hashLink(group.id)}><span><strong>{group.title}</strong><small>{group.topics.length} {group.topics.length === 1 ? "Thema" : "Themen"}</small></span><span aria-hidden="true">→</span></a></li>)}
      </ul>}
      </div>
      {menuFooter}
    </PageMenu>
    {view.kind === "topic" ? <article className={styles.content} tabIndex={-1} ref={focusTarget} aria-label={view.topic.title}>
      {view.topic.render()}
    </article> : <p className={styles.hint}>Wähle {view.kind === "group" ? "dein Thema" : "eine Unterkategorie"} im unteren Menü. Der passende Wissenstext erscheint direkt hier.</p>}
  </section>;
}
