/**
 * مهلة الطلب (مللي ثانية) — 15 ثانية لتجنب مشاكل HTTP/2
 * عند تغييرها غيّر يدوياً `export const maxDuration = …` في
 * `app/api/ai/chat-completion/route.ts` إلى نفس القيمة بالثواني.
 */
export const AI_REQUEST_TIMEOUT_MS = 15_000;

/** أقصى رسائل سياق تُرسل للنموذج (توفير توكنات الإدخال). */
export const AI_MAX_HISTORY_MESSAGES = 12;

/** أقصى طول لنص رسالة قديمة في السياق (أحرف). */
export const AI_MAX_HISTORY_CHARS = 2800;
