import { getHuntingDogVideoCourseLinks } from "../../lib/hunting-dog-video-course-links-server";

export function getStaticProps() {
  return { props: { courseLinks: getHuntingDogVideoCourseLinks() } };
}

export { default } from "../../components/HuntingDogVideos";
