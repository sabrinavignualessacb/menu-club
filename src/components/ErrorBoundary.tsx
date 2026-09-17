import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[220px] w-full flex flex-col items-center justify-center p-6 bg-amber-50/90 border border-amber-200 rounded-2xl text-slate-800 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            {this.props.fallbackTitle || 'Un incident d’affichage s’est produit'}
          </h3>
          <p className="text-xs text-slate-600 text-center max-w-md mb-4">
            {this.props.fallbackMessage ||
              'Une erreur temporaire est survenue. Vous pouvez recharger cet élément en toute sécurité sans perdre vos modifications.'}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Réessayer</span>
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <span>Recharger l’application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
