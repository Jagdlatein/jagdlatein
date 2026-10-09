import { wildlifePhotographs } from "./wildlife-photographs";

// Only these retired URLs may be migrated. Replacement bytes, attribution and
// source links come from the same reviewed photograph record.
export const retiredOfflinePhotoReplacements = Object.freeze(Object.fromEntries(
  Object.values(wildlifePhotographs).map(photo => [
    `/wildkunde/${photo.src.split("/").pop()}`,
    Object.freeze({ src: photo.src, alt: `Originalfotografie: ${photo.name}`, credit: photo.credit, creditUrl: photo.creditUrl,
      licenseUrl: photo.licenseUrl, author: photo.author, license: photo.license,
      sourcePage: photo.sourcePage, sha256: photo.sha256 }),
  ]).concat([["/marderhund.jpg", Object.freeze({
    src: wildlifePhotographs.marderhund.src, alt: `Originalfotografie: ${wildlifePhotographs.marderhund.name}`, credit: wildlifePhotographs.marderhund.credit,
    creditUrl: wildlifePhotographs.marderhund.creditUrl, licenseUrl: wildlifePhotographs.marderhund.licenseUrl,
    author: wildlifePhotographs.marderhund.author, license: wildlifePhotographs.marderhund.license,
    sourcePage: wildlifePhotographs.marderhund.sourcePage, sha256: wildlifePhotographs.marderhund.sha256,
  })]])
));

export function normalizeOfflinePackPhotos(pack) {
  const retiredPhotoPaths = [];
  const photos = pack.photos.map(photo => {
    const replacement = retiredOfflinePhotoReplacements[photo.src];
    if (!replacement) return photo;
    retiredPhotoPaths.push(replacement.src);
    return { ...photo, ...replacement };
  });
  // Do not persist a partial media update or change account/expiry/course data.
  return { pack: retiredPhotoPaths.length ? { ...pack, photos } : pack,
    retiredPhotoPaths: [...new Set(retiredPhotoPaths)] };
}
