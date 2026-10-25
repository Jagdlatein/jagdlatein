import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { readWebCoursePlatform } from "../lib/web-course-platform";

// SSR and the initial client render agree. Do not render the browser platform,
// its entry links or any conference embed before this first client check.
export default function useWebCoursePlatform() {
  const [platform, setPlatform] = useState("checking");
  useEffect(() => {
    setPlatform(readWebCoursePlatform({ browserWindow: window, browserNavigator: navigator, capacitor: Capacitor }));
  }, []);
  return platform;
}
