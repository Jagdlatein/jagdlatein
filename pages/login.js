import { useState } from "react";
 import { useRouter } from "next/router";

-function setCookie(name, value, days = 40) { /* entfällt */ }
-function delCookie(name) { /* entfällt */ }

 export default function LoginPage() {
   const router = useRouter();
   const [email, setEmail] = useState("");
   const [adminToken, setAdminToken] = useState("");
   const [busy, setBusy] = useState(false);
   const [msg, setMsg] = useState("");

   async function tryUserAccess(e) {
     e && e.preventDefault();
     setBusy(true); setMsg("");
     try {
-      const r = await fetch(`/api/auth/check?email=${encodeURIComponent(email)}`, { headers: { "Accept": "application/json" }, cache: "no-store" });
-      const data = await r.json();
-      if (!r.ok) throw new Error(data?.error || "Serverfehler");
-      if (data?.hasAccess) {
-        setCookie("jl_session", "1");
-        setCookie("jl_paid", "1");
-        setCookie("jl_email", encodeURIComponent(email));
-        setMsg("Erfolg: Zugang aktiv – weiter zum Quiz …");
-        router.replace("/quiz"); return;
-      } else {
-        setMsg("Kein aktives Abo zu dieser E-Mail gefunden.");
-      }
+      const r = await fetch("/api/auth/session", {
+        method: "POST",
+        headers: { "Content-Type": "application/json" },
+        body: JSON.stringify({ email }),
+      });
+      const data = await r.json();
+      if (!r.ok) throw new Error(data?.error || "Login/Check fehlgeschlagen");
+      setMsg("Erfolg: Zugang aktiv – weiter zum Quiz …");
+      router.replace("/quiz");
+      router.reload(); // stellt Cookie-Sync auch im Pages Router sicher
     } catch (err) {
       console.error(err);
       setMsg(err.message || "Unbekannter Fehler");
     } finally {
       setBusy(false);
     }
   }

   async function tryAdmin(e) {
     e && e.preventDefault();
     setBusy(true); setMsg("");
     try {
-      const r = await fetch("/api/admin/auth/check", { headers: { "Authorization": `Bearer ${adminToken}` }});
-      const data = await r.json();
-      if (data?.ok) {
-        setCookie("jl_admin", "1");
-        if (email) setCookie("jl_email", encodeURIComponent(email));
-        setCookie("jl_session", "1");
-        setMsg("Admin-Vorschau aktiv. Weiter zum Quiz …");
-        router.replace("/quiz");
-      } else {
-        setMsg("Admin-Token ungültig.");
-      }
+      const r = await fetch("/api/auth/session", {
+        method: "POST",
+        headers: { "Content-Type": "application/json" },
+        body: JSON.stringify({ email: email || undefined, adminToken }),
+      });
+      const data = await r.json();
+      if (!r.ok) throw new Error(data?.error || "Admin-Login fehlgeschlagen");
+      setMsg("Admin-Vorschau aktiv. Weiter zum Quiz …");
+      router.replace("/quiz");
+      router.reload();
     } catch (err) {
       console.error(err);
       setMsg("Admin-Check fehlgeschlagen.");
     } finally {
       setBusy(false);
     }
   }

   function doLogout() {
-    ["jl_session","jl_paid","jl_email","jl_admin"].forEach(delCookie);
-    setMsg("Abgemeldet.");
+    fetch("/api/auth/session", { method: "DELETE" })
+      .then(()=> setMsg("Abgemeldet."))
+      .catch(()=> setMsg("Fehler beim Abmelden"));
   }

   return (/* unverändert, deine UI bleibt */);
 }
