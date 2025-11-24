
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
      // Clear all local storage to fix data corruption
      localStorage.clear();
      // Specifically force reload to clear memory state
      window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
          <div className="w-full max-w-md p-6 text-center bg-white rounded-lg shadow-xl dark:bg-gray-800">
            <div className="flex justify-center mb-4">
               {/* Inline SVG to avoid import dependencies causing crashes in the ErrorBoundary itself */}
               <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
               </svg>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-800 dark:text-gray-100">Something went wrong</h1>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              The application encountered an unexpected error.
            </p>
            <div className="p-3 mb-6 text-left bg-red-50 border border-red-200 rounded dark:bg-red-900/20 dark:border-red-800 overflow-auto max-h-32">
                <p className="font-mono text-xs text-red-700 dark:text-red-300 break-all">
                    {this.state.error?.message || "Unknown error"}
                </p>
            </div>
            <div className="space-y-3">
                <button
                onClick={this.handleReload}
                className="flex items-center justify-center w-full px-4 py-2 text-white transition-colors rounded-md bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reload Application
                </button>
                <button
                    onClick={this.handleReset}
                    className="w-full px-4 py-2 text-xs text-gray-500 underline hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                    Full Reset (Clear Data & Reload)
                </button>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default ErrorBoundary;
