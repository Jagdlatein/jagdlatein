import manifest from '../public/lernen/klangbilder-2026/nachweise.json';
export const soundSpectrograms = Object.fromEntries(manifest.map(item => [item.id, item]));
export const soundSpectrogramAssetPaths = manifest.map(item => item.src);
export const soundSpectrogramSources = [
  { organization: 'Cornell Lab of Ornithology', title: 'Macaulay Library: From Sound to Images – Spectrogram creation', url: 'https://www.macaulaylibrary.org/2021/07/19/from-sound-to-images-part-1-a-deep-dive-on-spectrogram-creation/' },
  { organization: 'Audacity', title: 'Audacity Manual: Spectrogram View', url: 'https://manual.audacityteam.org/man/spectrogram_view.html' },
];
