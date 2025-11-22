export default function DebugCookies() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Cookie Debug</h1>
      <p><strong>Cookies:</strong></p>
      <pre>{document.cookie}</pre>
    </div>
  );
}
