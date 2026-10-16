import AppIcon from "./AppIcon";
import styles from "../styles/JagdakademiePromotion.module.css";

// Operator-requested advertisement. Own short descriptions, no imported logos,
// tracking, course prices, availability promises or asserted partnership.
export const jagdakademieOffers = [
  { title: "Jagdschein", description: "Ausbildung über die Referenzjagdschulen der DJA.", href: "https://deutsche-jagdakademie.com/dja-jagdschein-kurs/" },
  { title: "Jagdwirt (DJA)", description: "Weiterbildung für Jägerinnen und Jäger.", href: "https://deutsche-jagdakademie.com/dja-jagdwirt/" },
  { title: "Bergjagdseminar", description: "Vorbereitung auf die Anforderungen im alpinen Gelände.", href: "https://deutsche-jagdakademie.com/dja-bergjagd/" },
  { title: "DJA-Gütesiegel", description: "Informationen zum Zertifizierungssystem für Jagdschulen.", href: "https://deutsche-jagdakademie.com/dja-jagdschule-guetesiegel/" },
];
export default function JagdakademiePromotion() {
  return <aside className={styles.card} aria-label="Werbung: Deutsche Jagdakademie">
    <p className={styles.label}>Werbung · Externer Anbieter</p>
    <div className={styles.heading}><AppIcon name="book" size={32} /><div><h2>Deutsche Jagdakademie</h2><p>Ausbildung, Weiterbildung und Austausch – auch nach der Jagdprüfung.</p></div></div>
    <ul className={styles.offers}>{jagdakademieOffers.map(offer => <li key={offer.href}><a href={offer.href} target="_blank" rel="noopener noreferrer sponsored"><span><strong>{offer.title}</strong><span>{offer.description}</span></span><AppIcon name="arrow-right" size={19} /></a></li>)}</ul>
    <a className={styles.more} href="https://deutsche-jagdakademie.com/" target="_blank" rel="noopener noreferrer sponsored">Zur Deutschen Jagdakademie<AppIcon name="arrow-right" size={18} /></a>
  </aside>;
}
