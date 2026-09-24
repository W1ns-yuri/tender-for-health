import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, prevResetKey: props.resetKey };
  }

  static getDerivedStateFromProps(props, state) {
    if (props.resetKey !== state.prevResetKey) {
      return {
        hasError: false,
        error: null,
        prevResetKey: props.resetKey,
      };
    }
    return null;
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl text-center space-y-4 max-w-lg mx-auto my-12 shadow-sm">
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Произошел незначительный сбой при отображении</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {this.state.error?.toString() || 'Произошла ошибка рендеринга данных'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold inline-flex items-center space-x-2 shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Повторить попытку</span>
            </button>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (this.props.onReset) this.props.onReset();
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold inline-flex items-center space-x-2 shadow-xs transition-colors cursor-pointer"
            >
              <span>Вернуться на главную</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
