import { anthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export type ModelTier = 'production' | 'testing' | 'free';

export function getEngineModel(tier: ModelTier = 'production') {
  switch (tier) {
    case 'production':
      return anthropic('claude-sonnet-4-6');
    case 'testing':
      return openrouter('anthropic/claude-sonnet-4');
    case 'free':
      // Best free models on OpenRouter for structured clinical reasoning
      // nvidia/nemotron-3-super-120b-a12b:free — largest free model, great quality
      // meta-llama/llama-3.3-70b-instruct:free — strong alternative
      // minimax/minimax-m2.5:free — another capable option
      return openrouter('meta-llama/llama-3.3-70b-instruct:free');
  }
}
