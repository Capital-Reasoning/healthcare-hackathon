import { anthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export type ModelTier = 'production' | 'testing' | 'free' | 'onprem' | 'fast';

export function getEngineModel(tier: ModelTier = 'production') {
  switch (tier) {
    case 'production':
      return anthropic('claude-sonnet-4-6');
    case 'testing':
      return openrouter('anthropic/claude-sonnet-4.6');
    case 'fast':
      // GPT-5.4-mini via OpenRouter — fast + capable for high throughput
      return openrouter('openai/gpt-5.4-mini');
    case 'onprem':
      return openrouter('z-ai/glm-5');
    case 'free':
      return openrouter('meta-llama/llama-3.3-70b-instruct:free');
  }
}
