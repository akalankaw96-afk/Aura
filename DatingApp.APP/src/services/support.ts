/**
 * "Send us a message" on /support.
 *
 * Planned endpoint (docs/API_GUIDELINES.md → Planned: support messages):
 *   POST /api/support/messages  multipart: topic, subject, message, name, email, mobile?, paymentReference?, attachment?
 *     → 201 { reference: "SUP-4821" }
 * Members are matched by their token; everyone gives an email (we reply there) and may add a mobile (+94771234567).
 * An API without the endpoint (404 / 405, or no API at all) shows the labelled demo in development builds only;
 * the live site asks the member to email instead.
 */
import { apiRequest, hasStoredSession, toApiError } from "@/lib/http";
import { SUPPORT_EMAIL, type SupportTopic } from "@/content/support";

const DEV = process.env.NODE_ENV !== "production";

export interface SupportMessage {
  topic: SupportTopic;
  subject: string;
  message: string;
  name: string;
  email: string;
  /** international format, e.g. "+94771234567" */
  mobile?: string;
  paymentReference?: string;
  attachment?: File | null;
}

export class SupportNotAvailable extends Error {
  constructor() {
    super(`Messages can’t be sent from here yet. Please email us at ${SUPPORT_EMAIL}.`);
  }
}

/** Sends the message; resolves with the ticket reference (`demo` = development stand-in, nothing was sent). */
export async function sendSupportMessage(m: SupportMessage): Promise<{ reference: string; demo: boolean }> {
  const form = new FormData();
  form.append("topic", m.topic);
  form.append("subject", m.subject);
  form.append("message", m.message);
  form.append("name", m.name);
  form.append("email", m.email);
  if (m.mobile) form.append("mobile", m.mobile);
  if (m.paymentReference) form.append("paymentReference", m.paymentReference);
  if (m.attachment) form.append("attachment", m.attachment);

  let res: Response;
  try {
    res = await apiRequest("/support/messages", { method: "POST", body: form, auth: hasStoredSession(), timeoutMs: 60_000 });
  } catch (e) {
    if (DEV) return demo();
    throw e;
  }
  if (res.status === 404 || res.status === 405) {
    if (DEV) return demo();
    throw new SupportNotAvailable();
  }
  if (!res.ok) throw await toApiError(res, "We couldn’t send your message. Please try again.");
  const body = (await res.json().catch(() => ({}))) as { reference?: string };
  return { reference: body.reference || "SUP-…", demo: false };
}

async function demo() {
  await new Promise((r) => setTimeout(r, 600));
  return { reference: `SUP-${Math.floor(1000 + Math.random() * 9000)}`, demo: true };
}
