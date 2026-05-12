import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

// Edge runtime for fast AI responses
export const runtime = 'edge';
export const maxDuration = 30; // Reduced from 60 for faster responses

// Provider configuration with multiple keys and fallback system
const PROVIDERS = [
  {
    name: 'Gemini_Pro_1',
    provider: 'GEMINI',
    model: 'gemini-2.0-flash',
    keyEnv: 'GEMINI_API_KEY1',
    keyPrefix: 'AIza',
  },
  {
    name: 'Gemini_Pro_2',
    provider: 'GEMINI',
    model: 'gemini-2.0-flash',
    keyEnv: 'GEMINI_API_KEY2',
    keyPrefix: 'AIza',
  },
  {
    name: 'Groq_Llama_1',
    provider: 'GROQ',
    model: 'llama-3.1-8b-instant',
    keyEnv: 'GROQ_API_KEY1',
    keyPrefix: 'gsk_',
  },
  {
    name: 'Groq_Llama_2',
    provider: 'GROQ',
    model: 'llama-3.1-8b-instant',
    keyEnv: 'GROQ_API_KEY2',
    keyPrefix: 'gsk_',
  },
];

// Generate UUID using Web Crypto API (Edge compatible)
function generateId(): string {
  return crypto.randomUUID();
}

// Check if error is recoverable (can try next provider)
function isRecoverableError(error: unknown): boolean {
  const statusCode = (error as any)?.statusCode || (error as any)?.status || 0;
  const message = String(error).toLowerCase();
  
  // 429 (Rate Limit), 500, 502, 503, 504 are recoverable
  if ([429, 500, 502, 503, 504].includes(statusCode)) return true;
  
  // Network/timeout errors are recoverable
  if (message.includes('timeout') || 
      message.includes('econnreset') ||
      message.includes('socket') ||
      message.includes('fetch failed') ||
      message.includes('network') ||
      message.includes('abort') ||
      message.includes('http/2') ||
      message.includes('connection')) return true;
      
  return false;
}

// Log provider failure
function logProviderError(providerName: string, error: unknown, keyPresent: boolean) {
  const statusCode = (error as any)?.statusCode || (error as any)?.status || 'unknown';
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  console.error(`[AI Route] ❌ Provider ${providerName} FAILED`);
  console.error(`[AI Route]    Status Code: ${statusCode}`);
  console.error(`[AI Route]    Error: ${errorMessage.substring(0, 200)}`);
  console.error(`[AI Route]    API Key Present: ${keyPresent}`);
  console.error(`[AI Route]    Recoverable: ${isRecoverableError(error)}`);
}

// Call Gemini API using official SDK
async function callGemini(apiKey: string, model: string, messages: any[]) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const genModel = genAI.getGenerativeModel({ model });
  
  console.log(`[Gemini] Original messages:`, messages.map(m => m.role).join(', '));
  
  // Limit context to last 5 messages for speed
  const limitedMessages = messages.slice(-5);
  
  // Add system prompt at the beginning
  const messagesWithSystem = [
    { role: 'user', content: SYSTEM_PROMPT + '\n\nرد على رسالتي التالية:' },
    ...limitedMessages
  ];
  
  // Format messages for Gemini API
  // 1. Map roles: 'assistant' -> 'model', keep 'user' as is
  // 2. Ensure no consecutive duplicate roles
  // 3. Ensure first message is from 'user'
  const formattedMessages = messagesWithSystem.map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));
  
  console.log(`[Gemini] After role mapping:`, formattedMessages.map(m => m.role).join(', '));
  
  // Remove consecutive duplicates and ensure starts with user
  const sanitizedMessages = [];
  let lastRole = null;
  
  for (const msg of formattedMessages) {
    // Skip if same role as last message
    if (msg.role === lastRole) continue;
    sanitizedMessages.push(msg);
    lastRole = msg.role;
  }
  
  console.log(`[Gemini] After removing duplicates:`, sanitizedMessages.map(m => m.role).join(', '));
  
  // Ensure first message is from user - remove any leading 'model' messages
  while (sanitizedMessages.length > 0 && sanitizedMessages[0].role === 'model') {
    console.log(`[Gemini] Removing leading 'model' message`);
    sanitizedMessages.shift();
  }
  
  if (sanitizedMessages.length === 0) {
    throw new Error('No valid messages found after sanitization');
  }
  
  if (sanitizedMessages[0].role !== 'user') {
    throw new Error(`First message role is '${sanitizedMessages[0].role}', expected 'user'`);
  }
  
  console.log(`[Gemini] Final sanitized:`, sanitizedMessages.map(m => m.role).join(', '));
  
  // Split into history (all except last) and current message
  const history = sanitizedMessages.slice(0, -1);
  const lastMessage = sanitizedMessages[sanitizedMessages.length - 1];
  
  console.log(`[Gemini] History roles:`, history.map(m => m.role).join(', '));
  console.log(`[Gemini] Last message role:`, lastMessage.role);
  
  // Validate history doesn't start with model
  if (history.length > 0 && history[0].role === 'model') {
    throw new Error('History starts with model role - this should not happen');
  }
  
  // Start chat with history
  const chat = genModel.startChat({
    history: history,
  });
  
  // Send the last message
  const result = await chat.sendMessage(lastMessage.parts[0].text);
  const response = await result.response;
  const text = response.text();
  
  return {
    id: `chatcmpl-${generateId()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: model,
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: text,
      },
      finish_reason: 'stop',
    }],
  };
}

// System prompt - Cypher Arabic Assistant
const SYSTEM_PROMPT = `أنت Cypher، مساعد برمجة يتحدث باللغة العربية الفصحى.

طبيعة مساعدتك:
- ساعد في البرمجة: Python, JavaScript, HTML, CSS, Java, C++, وغيرها
- اشرح المفاهيم التقنية بوضوح و simplicity
- قدم حلولاً عملية للمشاكل البرمجية
- إذا لم تكن متأكداً، اطلب توضيحاً
- كن مفيداً ومحترماً في جميع الردود

مثال للرد:
"المشكلة بسيطة. انظر إلى الكود:
[code]
يمكننا إصلاحها هكذا. هل هذا واضح؟"

كن مساعد برمجة فعال ومفيد.`;

// Call Groq API with system prompt
async function callGroq(apiKey: string, model: string, messages: any[]) {
  const groq = new Groq({ apiKey });
  
  // Add system prompt at the beginning
  const messagesWithSystem = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages
  ];
  
  // Limit context to last 6 messages for speed
  const limitedMessages = messagesWithSystem.slice(-6);
  
  const response = await groq.chat.completions.create({
    model: model,
    messages: limitedMessages,
    temperature: 0.7,
    max_tokens: 400, // Further reduced for speed
  });
  
  return response;
}

export async function POST(request: NextRequest) {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  
  console.log(`[AI Route] [${requestId}] New request received`);

  try {
    const body = await request.json();
    const { messages, stream = false, parameters = {} } = body;

    if (!messages?.length || !Array.isArray(messages)) {
      console.error(`[AI Route] [${requestId}] Invalid request: missing messages`);
      return NextResponse.json(
        { error: 'Invalid request', details: 'messages array is required' },
        { status: 400 }
      );
    }

    console.log(`[AI Route] [${requestId}] Processing ${messages.length} messages, stream=${stream}`);

    // Check all API keys availability
    const availableProviders = PROVIDERS.map(p => {
      const key = process.env[p.keyEnv];
      const isValid = !!key && key.startsWith(p.keyPrefix);
      console.log(`[AI Route] [${requestId}] ${p.name}: ${isValid ? '✓ Available' : '✗ Missing/Invalid'} (${p.keyEnv})`);
      return { ...p, apiKey: key, isValid };
    }).filter(p => p.isValid);

    if (availableProviders.length === 0) {
      console.error(`[AI Route] [${requestId}] CRITICAL: No API keys configured`);
      return NextResponse.json(
        { 
          error: 'Service unavailable', 
          details: 'AI providers not configured. Check environment variables.' 
        },
        { status: 503 }
      );
    }

    console.log(`[AI Route] [${requestId}] ${availableProviders.length} providers available`);

    // Try each provider in sequence
    const errors: { provider: string; status: number | string; error: string }[] = [];

    for (const provider of availableProviders) {
      console.log(`[AI Route] [${requestId}] Trying ${provider.name} (${provider.provider}/${provider.model})...`);
      
      try {
        let response;
        
        if (provider.provider === 'GEMINI') {
          response = await callGemini(provider.apiKey!, provider.model, messages);
        } else {
          response = await callGroq(provider.apiKey!, provider.model, messages);
        }

        // Validate response structure
        if (!response || typeof response !== 'object') {
          throw new Error('Invalid response structure from provider');
        }

        console.log(`[AI Route] [${requestId}] ✅ SUCCESS with ${provider.name}`);
        
        // Return successful response with metadata
        return NextResponse.json({
          ...response,
          _meta: {
            provider: provider.name,
            model: provider.model,
            requestId,
            fallbackUsed: errors.length > 0,
            previousErrors: errors.length > 0 ? errors : undefined,
          }
        }, {
          headers: {
            'X-Cypher-Provider': provider.name,
            'X-Cypher-Model': provider.model,
            'X-Cypher-Request-Id': requestId,
          },
        });

      } catch (error) {
        logProviderError(provider.name, error, true);
        
        const statusCode = (error as any)?.statusCode || (error as any)?.status || 'unknown';
        errors.push({
          provider: provider.name,
          status: statusCode,
          error: error instanceof Error ? error.message : String(error),
        });

        // If error is NOT recoverable (like 401 auth error), stop immediately
        if (!isRecoverableError(error)) {
          console.error(`[AI Route] [${requestId}] 🛑 Non-recoverable error from ${provider.name}, aborting.`);
          break;
        }

        // Continue to next provider if recoverable
        console.log(`[AI Route] [${requestId}] 🔄 Falling back to next provider...`);
      }
    }

    // All providers exhausted
    console.error(`[AI Route] [${requestId}] ❌ All ${availableProviders.length} providers failed`);
    console.error(`[AI Route] [${requestId}] Error summary:`, errors);

    return NextResponse.json(
      { 
        error: 'All systems busy, please try again in a moment',
        details: 'All AI providers are currently unavailable',
        requestId,
        providerErrors: errors,
      },
      { 
        status: 503,
        headers: {
          'X-Cypher-Request-Id': requestId,
          'Retry-After': '30',
        },
      }
    );

  } catch (error) {
    console.error(`[AI Route] [${requestId}] FATAL ERROR:`, error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        requestId,
      },
      { status: 500 }
    );
  }
}
