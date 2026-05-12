import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

interface AIResponse {
  response: string;
  provider: 'gemini' | 'groq';
  keyIndex: number;
}

class AIService {
  private geminiKeys: string[];
  private groqKeys: string[];
  private geminiModel: string;
  private groqModel: string;
  private currentGeminiIndex = 0;
  private currentGroqIndex = 0;

  constructor() {
    this.geminiKeys = [
      process.env.GEMINI_API_KEY_1 || '',
      process.env.GEMINI_API_KEY_2 || ''
    ].filter(key => key !== '');

    this.groqKeys = [
      process.env.GROQ_API_KEY_1 || '',
      process.env.GROQ_API_KEY_2 || ''
    ].filter(key => key !== '');

    this.geminiModel = process.env.GEMINI_MODEL || 'gemini-pro';
    this.groqModel = process.env.GROQ_MODEL || 'mixtral-8x7b-32768';
  }

  private async tryGemini(prompt: string, keyIndex: number): Promise<AIResponse> {
    const genAI = new GoogleGenerativeAI(this.geminiKeys[keyIndex]);
    const model = genAI.getGenerativeModel({ model: this.geminiModel });
    
    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    
    return {
      response,
      provider: 'gemini',
      keyIndex
    };
  }

  private async tryGroq(prompt: string, keyIndex: number): Promise<AIResponse> {
    const groq = new Groq({ apiKey: this.groqKeys[keyIndex] });
    
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: this.groqModel,
    });
    
    return {
      response: completion.choices[0]?.message?.content || '',
      provider: 'groq',
      keyIndex
    };
  }

  async generateResponse(prompt: string): Promise<AIResponse> {
    let lastError: Error | null = null;

    // Try Gemini keys first
    for (let i = 0; i < this.geminiKeys.length; i++) {
      try {
        const geminiKeyIndex = (this.currentGeminiIndex + i) % this.geminiKeys.length;
        const response = await this.tryGemini(prompt, geminiKeyIndex);
        this.currentGeminiIndex = (geminiKeyIndex + 1) % this.geminiKeys.length;
        return response;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Gemini key ${geminiKeyIndex} failed:`, error);
      }
    }

    // Fallback to Groq keys
    for (let i = 0; i < this.groqKeys.length; i++) {
      try {
        const groqKeyIndex = (this.currentGroqIndex + i) % this.groqKeys.length;
        const response = await this.tryGroq(prompt, groqKeyIndex);
        this.currentGroqIndex = (groqKeyIndex + 1) % this.groqKeys.length;
        return response;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Groq key ${groqKeyIndex} failed:`, error);
      }
    }

    throw new Error(`All AI providers failed. Last error: ${lastError?.message}`);
  }

  async generateResponseWithImage(prompt: string, imageData: string): Promise<AIResponse> {
    // Try Gemini with vision first
    for (let i = 0; i < this.geminiKeys.length; i++) {
      try {
        const visionKeyIndex = (this.currentGeminiIndex + i) % this.geminiKeys.length;
        const genAI = new GoogleGenerativeAI(this.geminiKeys[visionKeyIndex]);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
        
        const imagePart = {
          inlineData: {
            data: imageData,
            mimeType: 'image/jpeg'
          }
        };
        
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response.text();
        
        this.currentGeminiIndex = (visionKeyIndex + 1) % this.geminiKeys.length;
        return {
          response,
          provider: 'gemini',
          keyIndex: visionKeyIndex
        };
      } catch (error) {
        console.warn(`Gemini vision key ${i} failed:`, error);
      }
    }

    // Fallback to text-only response
    return this.generateResponse(prompt);
  }
}

export const aiService = new AIService();
