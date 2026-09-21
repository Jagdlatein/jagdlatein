export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function isAuthorized(req) {
  const auth = req.headers.get("authorization") || "";
  const expected = process.env.ADMIN_PASS || "";

  return (
    expected &&
    auth.startsWith("Bearer ") &&
    auth.slice(7) === expected
  );
}

function getFirebaseApp() {
  if (getApps().length) {
    return getApps()[0];
  }

  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (!encoded) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 fehlt");
  }

  const serviceAccount = JSON.parse(
    Buffer.from(encoded, "base64").toString("utf8")
  );

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

export async function POST(req) {
  try {
    if (!isAuthorized(req)) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { title, body } = await req.json();

    if (
      typeof title !== "string" ||
      typeof body !== "string" ||
      !title.trim() ||
      !body.trim()
    ) {
      return Response.json(
        {
          success: false,
          error: "Titel und Nachricht sind erforderlich",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("push_tokens")
      .select("token")
      .eq("enabled", true);

    if (error) {
      return Response.json(
        {
          success: false,
          error: "Push-Tokens konnten nicht geladen werden",
        },
        { status: 500 }
      );
    }

    const tokens = (data || [])
      .map((row) => row.token)
      .filter(Boolean);

    if (tokens.length === 0) {
      return Response.json({
        success: true,
        sent: 0,
        failed: 0,
        total: 0,
      });
    }

    const messaging = getMessaging(getFirebaseApp());

    let sent = 0;
    let failed = 0;
    const invalidTokens = [];

    for (let i = 0; i < tokens.length; i += 500) {
      const batch = tokens.slice(i, i + 500);

      const result = await messaging.sendEachForMulticast({
        tokens: batch,
        notification: {
          title: title.trim(),
          body: body.trim(),
        },
        android: {
          priority: "high",
          notification: {
            sound: "default",
          },
        },
      });

      sent += result.successCount;
      failed += result.failureCount;

      result.responses.forEach((response, index) => {
        if (response.success) return;

        const code = response.error?.code;

        if (
          code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token"
        ) {
          invalidTokens.push(batch[index]);
        }
      });
    }

    if (invalidTokens.length > 0) {
      await supabase
        .from("push_tokens")
        .update({
          enabled: false,
          updated_at: new Date().toISOString(),
        })
        .in("token", invalidTokens);
    }

    return Response.json({
      success: true,
      sent,
      failed,
      disabled: invalidTokens.length,
      total: tokens.length,
    });
  } catch (error) {
    console.error("Push Send Fehler:", error);

    return Response.json(
      {
        success: false,
        error: error?.message || "Serverfehler",
      },
      { status: 500 }
    );
  }
}
