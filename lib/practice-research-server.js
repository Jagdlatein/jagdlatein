import { practiceResearchTopics } from "./practice-research";
import { wildlifePhotographs } from "./wildlife-photographs";
import cameraQuestions from "../data/practice-research/questions-wildkameras.json";
import disturbanceQuestions from "../data/practice-research/questions-wild-und-stoerung.json";
import springQuestions from "../data/practice-research/questions-rehwild-fruehling.json";

// Transfer only the two photographs used by this page, never the full atlas.
export function getPracticeResearchData() {
  const photos = Object.fromEntries([...new Set(practiceResearchTopics.map(topic => topic.photoKey))].map(key => {
    const photo = wildlifePhotographs[key];
    return [key, {
      src: photo.src, alt: photo.name, width: photo.width, height: photo.height,
      credit: photo.credit, creditUrl: photo.creditUrl, licenseUrl: photo.licenseUrl,
      modifications: Boolean(photo.modifications),
    }];
  }));
  return { topics: practiceResearchTopics, photos, questions: [...cameraQuestions, ...disturbanceQuestions, ...springQuestions] };
}
