/**
 * مهلة الطلب (مللي ثانية). عند تغييرها غيّر يدوياً `export const maxDuration = …` في
 * `app/api/ai/chat-completion/route.ts` إلى نفس القيمة بالثواني (رقم ثابت فقط — لا Math/استيراد).
 */
export const AI_REQUEST_TIMEOUT_MS = 10_000;

/** أقصى رسائل سياق تُرسل للنموذج (توفير توكنات الإدخال). */
export const AI_MAX_HISTORY_MESSAGES = 12;

/** أقصى طول لنص رسالة قديمة في السياق (أحرف). */
export const AI_MAX_HISTORY_CHARS = 2800;
