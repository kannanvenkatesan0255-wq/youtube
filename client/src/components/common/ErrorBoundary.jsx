/**
 * React Error Boundary Component
 * Graceful error state with YouTube-style fallback
 */
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center text-[#FF0033] mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1] mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-[#606060] dark:text-[#aaaaaa] max-w-md mb-6">
            An unexpected error occurred in VidTube. Try refreshing the page or navigating back.
          </p>
          <button
            onClick={this.handleReload}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0f0f0f] text-white hover:bg-neutral-800 dark:bg-white dark:text-[#0f0f0f] dark:hover:bg-neutral-200 text-sm font-medium transition"
          >
            <RefreshCw className="w-4 h-4" />
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
