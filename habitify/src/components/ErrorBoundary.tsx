import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-void flex items-center justify-center p-4">
          <div className="glass-card p-8 max-w-md w-full neon-border-pink text-center space-y-6">
            <div className="w-20 h-20 bg-neon-pink/10 rounded-full flex items-center justify-center mx-auto border border-neon-pink/30">
              <AlertTriangle size={40} className="text-neon-pink" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-syne text-white">SYSTEM ANOMALY</h2>
              <p className="text-text-muted text-sm">
                Habitify encountered an unexpected error. The mission trajectory has been interrupted.
              </p>
            </div>
            {this.state.error && (
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-left overflow-auto max-h-32">
                <code className="text-[10px] text-neon-pink font-mono">
                  {this.state.error.toString()}
                </code>
              </div>
            )}
            <button 
              onClick={() => window.location.reload()}
              className="w-full btn-neon btn-neon-pink py-3 flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} /> REBOOT SYSTEM
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
