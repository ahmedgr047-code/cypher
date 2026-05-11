import { AI_REQUEST_TIMEOUT_MS } from './constants';

/**
 * دالة محسّنة للاتصال بـ AI API مع:
 * - Logs دقيقة لكل خطوة
 * - Timeout 30 ثانية
 * - تجاوز الـ Cache
 * - معالجة أخطاء مفصلة
 */
export async function callAIEndpoint(endpoint: string, payload: object) {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`[AI Client ${requestId}] Starting request to ${endpoint}`);
  console.log(`[AI Client ${requestId}] Payload:`, JSON.stringify(payload, null, 2));
  console.log(`[AI Client ${requestId}] Timeout: ${AI_REQUEST_TIMEOUT_MS}ms`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error(`[AI Client ${requestId}] TIMEOUT after ${AI_REQUEST_TIMEOUT_MS}ms`);
    controller.abort();
  }, AI_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: 'no-store', // ⚡ تجاوز الـ Cache
    });

    console.log(`[AI Client ${requestId}] Response status: ${response.status}`);
    console.log(`[AI Client ${requestId}] Response headers:`, Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log(`[AI Client ${requestId}] Response data:`, JSON.stringify(data, null, 2));

    if (!response.ok || data.error) {
      console.error(`[AI Client ${requestId}] API Route Error:`, {
        status: response.status,
        error: data.error,
        details: data.details,
        attempts: data.attempts,
      });
      throw new Error(data.error || `Request failed: ${response.status}`);
    }

    console.log(`[AI Client ${requestId}] SUCCESS`);
    
    // إضافة معلومات debug للرد
    return {
      ...data,
      _debug: {
        requestId,
        provider: response.headers.get('X-Cypher-AI-Provider'),
        model: response.headers.get('X-Cypher-AI-Model'),
        attempts: response.headers.get('X-Cypher-Failover-Attempts'),
      },
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : 'Unknown';
    
    console.error(`[AI Client ${requestId}] REQUEST FAILED:`, {
      errorName,
      errorMessage: errorMsg,
      error: error,
    });
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`انتهت مهلة الرد (${AI_REQUEST_TIMEOUT_MS / 1000} ثانية). حاول سؤالاً أقصر أو أعد المحاولة.`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    console.log(`[AI Client ${requestId}] Request completed`);
  }
}
