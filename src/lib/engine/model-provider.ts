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
      return openrouter('nvidia/llama-3.3-nemotron-super-49b-v1:free');
  }
}
