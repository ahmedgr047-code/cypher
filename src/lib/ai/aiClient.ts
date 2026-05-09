import { AI_REQUEST_TIMEOUT_MS } from './constants';

export async function callAIEndpoint(endpoint: string, payload: object) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error('API Route Error:', {
        error: data.error,
        details: data.details,
      });
      throw new Error(data.error || `Request failed: ${response.status}`);
    }

    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`انتهت مهلة الرد (${AI_REQUEST_TIMEOUT_MS / 1000} ثانية). حاول سؤالاً أقصر أو أعد المحاولة.`);
    }
    console.error('API request error:', error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
