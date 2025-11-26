export default function Flag({ country = "DE" }) {
  const flags = {
    DE: "🇩🇪",
    AT: "🇦🇹",
    CH: "🇨🇭",
  };

  return <span style={{ marginLeft: 6 }}>{flags[country] || "🏳️"}</span>;
}
