import GlobalHomeButton from "../components/GlobalHomeButton";

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <GlobalHomeButton />
    </>
  );
}
