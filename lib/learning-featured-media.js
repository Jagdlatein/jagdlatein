import { wildlifePhotographs } from "./wildlife-photographs";
import { wildDetailPhotos } from "./wild-detail-atlas";
import dogVideos from "../public/lernen/hundevideos-2026/media-provenance.json";
import wildbretPhoto from "../public/lernen/wildbret-stuecke-2026/media-provenance.json";
import revierPhotos from "../public/lernen/kleines-revierleben-2026/bildnachweise.json";

// Read on the server: category pages receive photo credits, not entire learning datasets.
const goldenVideo = dogVideos.find(item => item.id === "golden-wasser");
const beePhoto = revierPhotos.find(item => item.id === "wildbienen");
const photoSummary = (photo, purpose) => ({
  src: photo.src, alt: photo.alt || photo.name, width: photo.width, height: photo.height,
  credit: photo.credit || `Foto: ${photo.author} · ${photo.license}`,
  creditUrl: photo.creditUrl || photo.sourceUrl,
  licenseUrl: photo.licenseUrl,
  purpose,
});

export const learningFeaturedMedia = {
  // Only actual teaching media from the linked tool. Research/index/quiz links
  // need no animal or landscape merely to fill a thumbnail position.
  "/lernen/wildjahr": photoSummary(wildlifePhotographs.gamswild, "Das tatsächliche Gams-Artporträt der Startauswahl wiedererkennen."),
  "/lernen/wildtier-details": photoSummary(wildDetailPhotos.rehSkull, "Den im Detailatlas verwendeten Rehschädel wiedererkennen."),
  "/lernen/jagdhund-videos": {
    src: "/lernen/hundevideos-2026/golden-wasser-vorschau.jpg",
    alt: "Standbild eines schwimmenden Golden Retrievers aus dem Originalvideo",
    width: goldenVideo.dimensions[0], height: goldenVideo.dimensions[1],
    credit: `Videostandbild: ${goldenVideo.author} · ${goldenVideo.license}`,
    creditUrl: goldenVideo.source, licenseUrl: goldenVideo.licenseUrl,
    purpose: "Das Standbild gehört zum tatsächlich gezeigten Originalvideo.",
  },
  "/lernen/wildbret-stuecke": {
    src: "/lernen/wildbret-stuecke-2026/reh-teilstuecke.webp",
    alt: "Reh-Teilstücke in einer Wildbearbeitungsstätte",
    width: wildbretPhoto.dimensions[0], height: wildbretPhoto.dimensions[1],
    credit: `Foto: ${wildbretPhoto.author} · ${wildbretPhoto.license}`,
    creditUrl: wildbretPhoto.source, licenseUrl: wildbretPhoto.licenseUrl,
    purpose: "Die im Lernwerkzeug zuzuordnenden Reh-Teilstücke wiedererkennen.",
  },
  "/lernen/kleines-revierleben": photoSummary(beePhoto, "Ein tatsächlich im Lernwerkzeug verwendetes Wildbienen-Bildbeispiel wiedererkennen."),
};
