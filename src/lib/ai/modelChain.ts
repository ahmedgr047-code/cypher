/**
 * ترتيب النماذج عند نفاد الحصة أو التوكنات أو ضغط الطلبات:
 * يُجرّب الأول ثم ينتقل تلقائياً للتالي إذا كان الخطأ قابلاً للتبديل (quota / rate limit / …).
 */
export type AiFailoverEntry = {
  provider: string;
  model: string;
};

/**
 * سلسلة الموديلات: Groq فقط (تجنب مشاكل HTTP/2 مع Gemini)
 * ترتيب: نستخدم 4 موديلات Groq للـ failover
 */
export const DEFAULT_AI_FAILOVER_CHAIN: AiFailoverEntry[] = [
  { provider: 'GROQ', model: 'groq/llama-3.1-8b-instant' },
  { provider: 'GROQ', model: 'groq/llama-3.3-70b-versatile' },
  { provider: 'GROQ', model: 'groq/llama-3.1-70b-versatile' },
  { provider: 'GROQ', model: 'groq/gemma-2-9b-it' },
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
  const statusCode = (error as any)?.statusCode || (error as any)?.status;
  const errorMessage = String(error).toLowerCase();
  const errorCode = (error as any)?.code || '';
  
  // أخطاء HTTP تستدعي failover
  if (statusCode === 429 || statusCode === 500 || statusCode >= 502) {
    return true;
  }
  
  // أخطاء الاتصال والشبكة
  if (
    errorMessage.includes('timeout') ||
    errorMessage.includes('econnreset') ||
    errorMessage.includes('socket hang up') ||
    errorMessage.includes('fetch failed') ||
    errorMessage.includes('http/2') ||
    errorMessage.includes('connection closed') ||
    errorMessage.includes('protocol error') ||
    errorCode === 'ECONNRESET' ||
    errorCode === 'ERR_HTTP2_GOAWAY'
  ) {
    return true;
  }
  
  // أنماط أخطاء تستدعي failover
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
  if (patterns.some((p) => errorMessage.includes(p))) return true;

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
