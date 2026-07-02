
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './Button';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }
  
  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg-muted dark:bg-slate-900 p-4">
            <div className="max-w-md w-full p-8 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 rounded-2xl shadow-2xl text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                An unexpected error occurred.
            </p>
            
            {this.state.error && (
                <div className="mb-6 text-left bg-gray-50 dark:bg-slate-900 p-3 rounded border border-gray-200 dark:border-slate-700 overflow-auto max-h-32">
                    <p className="text-xs font-mono text-red-600 dark:text-red-400 whitespace-pre-wrap break-words">
                        {this.state.error.toString()}
                    </p>
                </div>
            )}

            <div className="flex flex-col gap-3">
                <Button variant="primary" onClick={this.handleReload} className="w-full justify-center">
                    Reload Page
                </Button>
            </div>
            </div>
        </div>
      );
    }

    return <>{(this as any).props.children}</>;
  }
}