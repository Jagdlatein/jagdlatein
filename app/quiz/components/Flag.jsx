export default function Flag({ country }) {
  const src = {
    DE: "/flags/de.svg",
    AT: "/flags/at.svg",
    CH: "/flags/ch.svg",
  }[country];

  return (
    <img
      src={src}
      alt={country}
      style={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        objectFit: "cover",
        marginLeft: 6,
      }}
    />
  );
}
