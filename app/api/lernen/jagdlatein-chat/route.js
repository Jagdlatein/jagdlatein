import { requirePaidAccount } from "../../../../lib/account-access";
import { normalizeExamProfile } from "../../../../lib/exam-profile";
import { answerJagdlateinQuestion } from "../../../../lib/jagdlatein-chat";
import { MAX_JAGDLATEIN_QUESTION_LENGTH } from "../../../../lib/jagdlatein-chat-limits";
import { CHAT_REQUEST_MAX_BYTES, ChatRequestBodyError, assertChatRequestActive, readChatRequestBody } from "../../../../lib/chat-request-body";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = CHAT_REQUEST_MAX_BYTES;
const response = (body, status = 200) => Response.json(body, {
  status, headers: { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie" },
});

export async function POST(req) {
  const origin = req.headers.get("origin");
  const fetchSite = req.headers.get("sec-fetch-site");
  if (origin !== new URL(req.url).origin || (fetchSite && fetchSite !== "same-origin")) {
    return response({ message: "Diese Anfrage ist nicht erlaubt." }, 403);
  }
  const contentType = (req.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") return response({ message: "Ungültiges Anfrageformat." }, 415);
  const length = req.headers.get("content-length");
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > MAX_BODY_BYTES)) {
    return response({ message: "Die Anfrage ist zu gross." }, 413);
  }

  try {
    await requirePaidAccount(req);
    const { body, tooLarge } = await readChatRequestBody(req);
    assertChatRequestActive(req);
    if (tooLarge) return response({ message: "Die Anfrage ist zu gross." }, 413);
    if (!body || typeof body !== "object" || Array.isArray(body) ||
        Object.keys(body).some(key => key !== "question" && key !== "examProfile") ||
        typeof body.question !== "string" || !body.question.trim() || body.question.length > MAX_JAGDLATEIN_QUESTION_LENGTH) {
      return response({ message: `Gib eine Frage mit höchstens ${MAX_JAGDLATEIN_QUESTION_LENGTH} Zeichen ein.` }, 400);
    }
    const profile = normalizeExamProfile(body.examProfile);
    if (body.examProfile != null && (!profile || Object.keys(body.examProfile).length !== 2)) {
      return response({ message: "Die Prüfungsregion ist ungültig." }, 400);
    }
    assertChatRequestActive(req);
    return response(answerJagdlateinQuestion(body.question.trim(), profile));
  } catch (error) {
    if (error instanceof ChatRequestBodyError) return response({ message: error.message }, error.status);
    if (error?.status === 401) return response({ message: "Bitte melde dich erneut an." }, 401);
    if (error?.status === 403) return response({ message: "Für den Lernchat ist ein aktiver Zugang nötig." }, 403);
    return response({ message: "Der Lernchat ist vorübergehend nicht verfügbar. Versuch es später erneut." }, 503);
  }
}
