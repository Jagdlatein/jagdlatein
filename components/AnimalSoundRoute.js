import { useRouter } from "next/router";
import AnimalSounds from "./AnimalSounds";
import AnimalSoundDetail from "./AnimalSoundDetail";
import { resolveAnimalSoundRoute } from "../lib/animal-sound-navigation";

export default function AnimalSoundRoute() {
  const router = useRouter();
  const selection = resolveAnimalSoundRoute(router.query, router.isReady === true);
  // The existing library and its blind listening rounds keep their own local
  // controls. An explicit sound URL always opens exactly that recording.
  return selection.status === "library" ? <AnimalSounds /> : <AnimalSoundDetail />;
}
