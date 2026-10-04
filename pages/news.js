import JagdNews from "../components/JagdNews";
import { getJagdNews } from "../lib/jagd-news-server";
import { newsRefreshSeconds } from "../lib/news-catalog";

export async function getStaticProps() {
  return { props: { initialNews: await getJagdNews() }, revalidate: newsRefreshSeconds };
}

export default function NewsPage({ initialNews }) {
  return <JagdNews initialNews={initialNews} />;
}
