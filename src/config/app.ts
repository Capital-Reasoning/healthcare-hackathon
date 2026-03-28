export const APP_CONFIG = {
  name: 'BestPath',
  tagline: 'AI-powered healthcare insights',
  description: 'Real-time population health metrics and AI-powered data analysis',
  version: '0.1.0',
} as const;

export type AppConfig = typeof APP_CONFIG;
