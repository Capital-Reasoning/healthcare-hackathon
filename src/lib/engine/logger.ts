type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  data?: Record<string, unknown>;
  durationMs?: number;
}

export function createEngineLogger(component: string) {
  return {
    info: (message: string, data?: Record<string, unknown>) =>
      log('info', component, message, data),
    warn: (message: string, data?: Record<string, unknown>) =>
      log('warn', component, message, data),
    error: (message: string, data?: Record<string, unknown>) =>
      log('error', component, message, data),
    debug: (message: string, data?: Record<string, unknown>) =>
      log('debug', component, message, data),
    time: (label: string) => {
      const start = performance.now();
      return {
        end: (data?: Record<string, unknown>) => {
          const duration = Math.round(performance.now() - start);
          log('info', component, `${label} completed`, { ...data, durationMs: duration });
          return duration;
        },
      };
    },
  };
}

function log(level: LogLevel, component: string, message: string, data?: Record<string, unknown>) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    component,
    message,
    ...(data && { data }),
  };
  const prefix = { info: 'i', warn: '!', error: 'X', debug: '?' }[level];
  console.log(
    `[${prefix}] [${entry.timestamp}] [${component}] ${message}`,
    data ? JSON.stringify(data, null, 2) : '',
  );
}
