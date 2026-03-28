'use client';
import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-lg border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Something went wrong loading this section.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-2 text-xs text-primary underline"
            >
              Try again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
