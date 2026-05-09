/**
 * مهلة الطلب (مللي ثانية). عند تغييرها غيّر يدوياً `export const maxDuration = …` في
 * `app/api/ai/chat-completion/route.ts` إلى نفس القيمة بالثواني (رقم ثابت فقط — لا Math/استيراد).
 */
export const AI_REQUEST_TIMEOUT_MS = 20_000;
