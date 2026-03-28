import { anthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export type ModelTier = 'production' | 'testing' | 'free' | 'onprem';

export function getEngineModel(tier: ModelTier = 'production') {
  switch (tier) {
    case 'production':
      // Claude Sonnet via Anthropic direct — best quality for demo
      return anthropic('claude-sonnet-4-6');
    case 'testing':
      // Claude Sonnet via OpenRouter — for development testing
      return openrouter('anthropic/claude-sonnet-4');
    case 'onprem':
      // GLM-5 via OpenRouter — proves on-prem deployment feasibility
      // (no cloud AI dependency, could run locally)
      return openrouter('z-ai/glm-5');
    case 'free':
      return openrouter('meta-llama/llama-3.3-70b-instruct:free');
  }
}
