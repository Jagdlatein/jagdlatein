// pages/jagdbuch.js

export default function JagdbuchRedirect() {
  if (typeof window !== "undefined") {
    window.location.replace("/jagdbuch");
  }

  return null;
}
