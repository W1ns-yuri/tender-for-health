import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
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
        <div className="p-8 bg-rose-50/50 border border-rose-200 rounded-2xl text-center space-y-4 max-w-lg mx-auto my-12 shadow-sm">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800">Произошел незначительный сбой при отображении</h3>
          <p className="text-xs text-slate-500">
            {this.state.error?.toString() || 'Произошла ошибка рендеринга данных'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              if (this.props.onReset) this.props.onReset();
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold inline-flex items-center space-x-2 shadow-xs transition-colors"
          >
            <RefreshCw size={14} />
            <span>Вернуться на главную</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
