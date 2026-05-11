import { NextRequest, NextResponse } from 'next/server';
import { completion } from '@rocketnew/llm-sdk';
import {
  getAiFailoverChain,
  getApiKeysForProvider,
  shouldFailOverToNextModel,
  filterModelsWithValidKeys,
} from '@/lib/ai/modelChain';

/** يجب أن يبقى رقماً ثابتاً — يطابق 30 ث في `lib/ai/constants.ts` (30000 ms). */
export const maxDuration = 30;

/** استخدام Edge Runtime لسرعة أفضل وتفادي قيود Serverless */
export const runtime = 'edge';


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
  const requestId = `chat-${Date.now()}`;
  let body: any = {};

  console.log(`[${requestId}] Received chat completion request`);

  try {
    body = await request.json();
    const { provider, model, messages, stream = false, parameters = {}, failover } = body;
    
    console.log(`[${requestId}] Request details:`, {
      provider: provider || 'auto',
      model: model || 'auto',
      failover: failover === true || !provider || !model,
      messagesCount: messages?.length || 0,
      stream,
    });

    // تفعيل failover تلقائياً إذا لم يُحدد provider (لتجنب أخطاء GEMINI)
    const useFailover = failover === true || !provider || !model;

    if (!messages?.length) {
      return NextResponse.json(
        { error: 'Missing required field: messages', details: 'Request validation failed' },
        { status: 400 }
      );
    }

    if (useFailover) {
      console.log('[AI Failover] Starting failover process...');
      console.log('[AI Failover] Environment check:');
      console.log('  - GROQ_API_KEY_1:', process.env.GROQ_API_KEY_1 ? '✓ Set' : '✗ Missing');
      console.log('  - GROQ_API_KEY_2:', process.env.GROQ_API_KEY_2 ? '✓ Set' : '✗ Missing');
      console.log('  - GEMINI_API_KEY_1:', process.env.GEMINI_API_KEY_1 ? '✓ Set' : '✗ Missing');
      console.log('  - GEMINI_API_KEY_2:', process.env.GEMINI_API_KEY_2 ? '✓ Set' : '✗ Missing');
      console.log('  - OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✓ Set' : '✗ Missing');
      
      if (stream) {
        return NextResponse.json(
          {
            error: 'Streaming with failover is not supported',
            details: 'Use stream: false when failover is enabled',
          },
          { status: 400 }
        );
      }

      // الحصول على قائمة الموديلات وفلترة تلك التي لها API Keys صالحة
      const allChain = getAiFailoverChain();
      console.log('[AI Failover] All configured models:', allChain.map(c => `${c.provider}/${c.model}`).join(', '));
      
      const chain = filterModelsWithValidKeys(allChain);
      console.log('[AI Failover] Models with valid keys:', chain.map(c => `${c.provider}/${c.model}`).join(', '));
      
      if (!chain.length) {
        return NextResponse.json(
          {
            error: 'No AI API keys configured for failover',
            details:
              'Add GEMINI_API_KEY_1 / GEMINI_API_KEY_2 and/or GROQ_API_KEY_1 / GROQ_API_KEY_2 and/or OPENAI_API_KEY (انظر .env.example)',
          },
          { status: 503 }
        );
      }

      const allErrors: { provider: string; model: string; keyIndex: number; error: string }[] = [];

      // تجربة كل موديل في القائمة
      for (const entry of chain) {
        const keys = getApiKeysForProvider(entry.provider);
        
        for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
          const apiKey = keys[keyIndex];
          
          try {
            console.log(`[AI Failover] Trying ${entry.provider} / ${entry.model} (key ${keyIndex + 1})...`);
            
            const response = await completion({
              model: entry.model,
              messages,
              stream: false,
              api_key: apiKey,
              ...parameters,
            });

            console.log(`[AI Failover] ✅ SUCCESS with ${entry.provider} / ${entry.model} (key ${keyIndex + 1})`);
            console.log(`[AI Failover] Response preview:`, response?.choices?.[0]?.message?.content?.substring(0, 100) || 'No content');
            
            return NextResponse.json(response, {
              headers: {
                'X-Cypher-AI-Provider': entry.provider,
                'X-Cypher-AI-Model': entry.model,
                'X-Cypher-AI-Key-Slot': String(keyIndex + 1),
                'X-Cypher-Failover-Attempts': String(allErrors.length),
              },
            });
            
          } catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            const errStatus = (error as any)?.statusCode || (error as any)?.status || 500;
            const errStack = error instanceof Error ? error.stack : '';
            
            console.error(`[AI Failover] ❌ FAILED: ${entry.provider} / ${entry.model} (key ${keyIndex + 1})`);
            console.error(`[AI Failover]    Status: ${errStatus}`);
            console.error(`[AI Failover]    Error: ${errMsg}`);
            console.error(`[AI Failover]    Stack: ${errStack?.substring(0, 500)}`);
            console.error(`[AI Failover]    API Key present: ${apiKey ? 'YES' : 'NO'}`);
            console.error(`[AI Failover]    API Key length: ${apiKey?.length || 0}`);
            
            allErrors.push({
              provider: entry.provider,
              model: entry.model,
              keyIndex: keyIndex + 1,
              error: errMsg,
            });

            // إذا كان الخطأ لا يستدعي التبديل، نتوقف مباشرة
            if (!shouldFailOverToNextModel(error)) {
              console.error(`[AI Failover] 🛑 Non-recoverable error from ${entry.provider}, stopping.`);
              break;
            }
            
            console.log(`[AI Failover] 🔄 Moving to next model...`);
            // خلاف ذلك، نكمل للموديل التالي
          }
        }
      }

      // جميع الموديلات فشلت
      console.error('[AI Failover] All models exhausted. Errors:', allErrors);
      
      const lastError = allErrors[allErrors.length - 1];
      return NextResponse.json(
        { 
          error: 'All AI providers failed',
          details: `Tried ${allErrors.length} attempts. Last error from ${lastError?.provider}: ${lastError?.error}`,
          attempts: allErrors,
        },
        { status: 502 }
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
