// This website-based development build deliberately cannot pass a store release check.
// Replace this gate only after the integrations documented in README.md are tested.
console.error("Noch keine App-Store-Freigabe: Apple-Abos, Kontolöschung und Datenschutz");
console.error("müssen geprüft werden. Echte iPhone-Tests und Signierung fehlen.");
process.exitCode = 1;
