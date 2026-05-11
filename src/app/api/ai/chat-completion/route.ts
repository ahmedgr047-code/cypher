import { NextRequest, NextResponse } from 'next/server';
import { completion } from '@rocketnew/llm-sdk';
import {
  getAiFailoverChain,
  getApiKeysForProvider,
  shouldFailOverToNextModel,
} from '@/lib/ai/modelChain';

/** يجب أن يبقى رقماً ثابتاً — يطابق 10 ث في `lib/ai/constants.ts` (10000 ms). */
export const maxDuration = 10;


function formatErrorResponse(error: unknown, provider?: string) {
  const statusCode = (error as any)?.statusCode || (error as any)?.status || 500;
  const providerName = (error as any)?.llmProvider || provider || 'Unknown';

  return {
    error: `${providerName.toUpperCase()} API error: ${statusCode}`,
    details: error instanceof Error ? error.message : String(error),
    statusCode,
  };
}

/** رمز خطأ مزوّد الذكاء الاصطناعي (مثل 404 لموديل محذوف) لا يُعرَض كـ 404 لمسار Next — يُربك المتصفح */
function httpStatusForUpstreamFailure(upstreamCode: number): number {
  if (upstreamCode === 404 || upstreamCode === 410) return 502;
  if (upstreamCode < 400 || upstreamCode >= 600) return 502;
  return upstreamCode;
}

export async function POST(request: NextRequest) {
  let body: any = {};

  try {
    body = await request.json();
    const { provider, model, messages, stream = false, parameters = {}, failover } = body;

    // تفعيل failover تلقائياً إذا لم يُحدد provider (لتجنب أخطاء GEMINI)
    const useFailover = failover === true || !provider || !model;

    if (!messages?.length) {
      return NextResponse.json(
        { error: 'Missing required field: messages', details: 'Request validation failed' },
        { status: 400 }
      );
    }

    if (useFailover) {
      if (stream) {
        return NextResponse.json(
          {
            error: 'Streaming with failover is not supported',
            details: 'Use stream: false when failover is enabled',
          },
          { status: 400 }
        );
      }

      const chain = getAiFailoverChain();
      let lastError: unknown;
      let attempted = false;

      outer: for (const entry of chain) {
        const keys = getApiKeysForProvider(entry.provider);
        if (!keys.length) continue;

        for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
          const apiKey = keys[keyIndex];
          attempted = true;
          try {
            const response = await completion({
              model: entry.model,
              messages,
              stream: false,
              api_key: apiKey,
              ...parameters,
            });

            return NextResponse.json(response, {
              headers: {
                'X-Cypher-AI-Provider': entry.provider,
                'X-Cypher-AI-Model': entry.model,
                'X-Cypher-AI-Key-Slot': String(keyIndex + 1),
              },
            });
          } catch (error) {
            lastError = error;
            if (!shouldFailOverToNextModel(error)) break outer;
          }
        }
      }

      if (!attempted) {
        return NextResponse.json(
          {
            error: 'No AI API keys configured for failover',
            details:
              'Add GEMINI_API_KEY_1 / GEMINI_API_KEY_2 and/or GROQ_API_KEY_1 / GROQ_API_KEY_2 and/or OPENAI_API_KEY (انظر .env.example)',
          },
          { status: 503 }
        );
      }

      const formatted = formatErrorResponse(lastError, chain[0]?.provider);
      console.error('API Route Error (failover exhausted):', {
        error: formatted.error,
        details: formatted.details,
      });
      return NextResponse.json(
        { error: formatted.error, details: formatted.details },
        { status: httpStatusForUpstreamFailure(formatted.statusCode) }
      );
    }

    if (!provider || !model) {
      return NextResponse.json(
        { error: 'Missing required fields: provider, model (or set failover: true)', details: 'Request validation failed' },
        { status: 400 }
      );
    }

    const providerKeys = getApiKeysForProvider(provider);
    const apiKey = providerKeys[0];
    if (!apiKey) {
      return NextResponse.json(
        {
          error: `${provider.toUpperCase()} API key is not configured`,
          details:
            'For GEMINI use GEMINI_API_KEY_1 / GEMINI_API_KEY_2; for GROQ use GROQ_API_KEY_1 / GROQ_API_KEY_2 (see Vercel Environment Variables)',
        },
        { status: 400 }
      );
    }

    if (stream) {
      const response = await completion({
        model,
        messages,
        stream: true,
        api_key: apiKey,
        ...parameters,
      });

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start' })}\n\n`));

            for await (const chunk of response as unknown as AsyncIterable<unknown>) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', chunk })}\n\n`));
            }

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
            controller.close();
          } catch (error) {
            const formatted = formatErrorResponse(error, provider);
            console.error('API Route Error:', { error: formatted.error, details: formatted.details });
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: formatted.error, details: formatted.details })}\n\n`));
            controller.close();
          }
        },
      });

      return new NextResponse(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    const response = await completion({
      model,
      messages,
      stream: false,
      api_key: apiKey,
      ...parameters,
    });

    return NextResponse.json(response);
  } catch (error) {
    const formatted = formatErrorResponse(error, body?.provider);
    console.error('API Route Error:', { error: formatted.error, details: formatted.details });
    return NextResponse.json(
      { error: formatted.error, details: formatted.details },
      { status: httpStatusForUpstreamFailure(formatted.statusCode) }
    );
  }
}
