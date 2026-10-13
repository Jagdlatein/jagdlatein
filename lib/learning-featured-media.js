import { wildlifePhotographs } from "./wildlife-photographs";
import { wildDetailPhotos } from "./wild-detail-atlas";
import { categoryPhotographs } from "./learning-category-photos";
import dogVideos from "../public/lernen/hundevideos-2026/media-provenance.json";
import wildbretPhoto from "../public/lernen/wildbret-stuecke-2026/media-provenance.json";
import revierPhotos from "../public/lernen/kleines-revierleben-2026/bildnachweise.json";

// Read on the server: category pages receive photo credits, not entire learning datasets.
const goldenVideo = dogVideos.find(item => item.id === "golden-wasser");
const beePhoto = revierPhotos.find(item => item.id === "wildbienen");
const photoSummary = photo => ({
  src: photo.src, alt: photo.alt || photo.name, width: photo.width, height: photo.height,
  credit: photo.credit || `Foto: ${photo.author} · ${photo.license}`,
  creditUrl: photo.creditUrl || photo.sourceUrl,
  licenseUrl: photo.licenseUrl,
});

export const learningFeaturedMedia = {
  "/lernen/wildjahr": photoSummary(wildlifePhotographs.gamswild),
  "/lernen/wildtier-details": photoSummary(wildDetailPhotos.rehSkull),
  "/lernen/jagdhund-videos": {
    src: "/lernen/hundevideos-2026/golden-wasser-vorschau.jpg",
    alt: "Standbild eines schwimmenden Golden Retrievers aus dem Originalvideo",
    width: goldenVideo.dimensions[0], height: goldenVideo.dimensions[1],
    credit: `Videostandbild: ${goldenVideo.author} · ${goldenVideo.license}`,
    creditUrl: goldenVideo.source, licenseUrl: goldenVideo.licenseUrl,
  },
  "/lernen/wildbret-stuecke": {
    src: "/lernen/wildbret-stuecke-2026/reh-teilstuecke.webp",
    alt: "Reh-Teilstücke in einer Wildbearbeitungsstätte",
    width: wildbretPhoto.dimensions[0], height: wildbretPhoto.dimensions[1],
    credit: `Foto: ${wildbretPhoto.author} · ${wildbretPhoto.license}`,
    creditUrl: wildbretPhoto.source, licenseUrl: wildbretPhoto.licenseUrl,
  },
  "/lernen/kleines-revierleben": photoSummary(beePhoto),
  "/lernen/forschung-verstehen": photoSummary(categoryPhotographs["natur-revier"]),
  "/lernen/fuenf-minuten": photoSummary(categoryPhotographs["pruefung-sprache"]),
};
