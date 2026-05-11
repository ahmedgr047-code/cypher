/**
 * ترتيب النماذج عند نفاد الحصة أو التوكنات أو ضغط الطلبات:
 * يُجرّب الأول ثم ينتقل تلقائياً للتالي إذا كان الخطأ قابلاً للتبديل (quota / rate limit / …).
 */
export type AiFailoverEntry = {
  provider: string;
  model: string;
};

/**
 * سلسلة الموديلات: 2 Gemini + 2 Groq
 * ترتيب: Gemini أولاً (1) ثم Groq ثم Gemini (2) ثم Groq (2)
 */
export const DEFAULT_AI_FAILOVER_CHAIN: AiFailoverEntry[] = [
  { provider: 'GEMINI', model: 'gemini-2.0-flash' },
  { provider: 'GROQ', model: 'groq/llama-3.1-8b-instant' },
  { provider: 'GEMINI', model: 'gemini-1.5-flash' },
  { provider: 'GROQ', model: 'groq/llama-3.3-70b-versatile' },
];

function parseEnvChain(): AiFailoverEntry[] | null {
  const raw = process.env.AI_MODEL_CHAIN_JSON?.trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length < 1) return null;
    
    // ⚡ حماية: إذا كان الإعداد يحتوي على خطأ إملائي شائع "grop"، نتجاهله
    const hasInvalid = parsed.some((item: any) => 
      item?.model?.toLowerCase().includes('grop')
    );
    if (hasInvalid) {
      console.warn('AI_MODEL_CHAIN_JSON contains invalid model "grop", using default chain');
      return null;
    }
    
    const out: AiFailoverEntry[] = [];
    for (const item of parsed) {
      if (
        item &&
        typeof item === 'object' &&
        'provider' in item &&
        'model' in item &&
        typeof (item as AiFailoverEntry).provider === 'string' &&
        typeof (item as AiFailoverEntry).model === 'string'
      ) {
        out.push({ provider: (item as AiFailoverEntry).provider, model: (item as AiFailoverEntry).model });
      }
    }
    return out.length ? out : null;
  } catch {
    return null;
  }
}

export function getAiFailoverChain(): AiFailoverEntry[] {
  return parseEnvChain() ?? DEFAULT_AI_FAILOVER_CHAIN;
}

/**
 * مفاتيح المزوّد بالترتيب: يُجرّب الأول فإن نفدت الحصّة يُستخدم الثاني (مناسب لـ Vercel: زوز Gemini وزوز Groq).
 * يدعم الأسماء القديمة GEMINI_API_KEY / GROQ_API_KEY كاحتياط إن وُجدت.
 */
export function getApiKeysForProvider(provider: string): string[] {
  const p = provider.toUpperCase();
  const raw: (string | undefined)[] = [];

  if (p === 'GEMINI') {
    raw.push(
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY
    );
  } else if (p === 'GROQ') {
    raw.push(process.env.GROQ_API_KEY_1, process.env.GROQ_API_KEY_2, process.env.GROQ_API_KEY);
  } else if (p === 'OPEN_AI') {
    raw.push(process.env.OPENAI_API_KEY);
  } else if (p === 'ANTHROPIC') {
    raw.push(process.env.ANTHROPIC_API_KEY);
  } else if (p === 'PERPLEXITY') {
    raw.push(process.env.PERPLEXITY_API_KEY);
  }

  const seen = new Set<string>();
  const out: string[] = [];
  for (const k of raw) {
    const t = k?.trim();
    if (t && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  return out;
}

/** أخطاء يُفترض أنها مؤقتة أو متعلقة بالحصة — ننتقل للموديل التالي. */
export function shouldFailOverToNextModel(error: unknown): boolean {
  const status =
    (error as { statusCode?: number })?.statusCode ??
    (error as { status?: number })?.status ??
    (error as { response?: { status?: number } })?.response?.status;

  /* أي خطأ 5xx أو 4xx يعني ننتقل للموديل التالي */
  if (status === 500 || status === 501 || status === 502 || status === 503 || status === 504) return true;
  if (status === 429 || status === 408) return true;
  if (status === 402 || status === 403) return true;
  /* موديل Google معطّل/غير موجود — ننتقل لـ Groq */
  if (status === 404 || status === 410) return true;

  const msg = `${error instanceof Error ? error.message : String(error)}`.toLowerCase();
  const patterns = [
    'quota',
    'rate limit',
    'ratelimit',
    'resource exhausted',
    'resource_exhausted',
    'billing',
    'insufficient',
    'exceeded',
    'too many requests',
    'capacity',
    'overloaded',
    'timeout',
    'timed out',
    'temporarily',
    'try again',
    'limit exceeded',
    'not_found',
    'not found',
    'notfound',
    'geminiexception',
    'deprecated',
    'api error',
    'unable to detect provider',
    'invalid api key',
    'authentication failed',
    'bad request',
  ];
  if (patterns.some((p) => msg.includes(p))) return true;

  return false;
}

/** 
 * فلترة قائمة الموديلات — نحتفظ فقط بالموديلات التي لها API Key صالح
 * لتجنب محاولة استخدام موديل بدون مفتاح
 */
export function filterModelsWithValidKeys(chain: AiFailoverEntry[]): AiFailoverEntry[] {
  return chain.filter((entry) => {
    const keys = getApiKeysForProvider(entry.provider);
    return keys.length > 0;
  });
}
