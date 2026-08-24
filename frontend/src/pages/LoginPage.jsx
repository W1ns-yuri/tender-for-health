import React, { useState } from 'react';
import { Lock, User, LogIn, AlertCircle } from 'lucide-react';
import API from '../services/api';

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await API.post('/auth/login', { username, password });
      if (res.data?.token) {
        localStorage.setItem('tender_token', res.data.token);
        localStorage.setItem('tender_user', JSON.stringify(res.data.user));
        onLoginSuccess(res.data.user, res.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Неверный логин или пароль');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoUser, demoPass) => {
    setUsername(demoUser);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen w-full bg-[#3d98fb] md:bg-gradient-to-br md:from-[#2e88ed] md:to-[#64b5f6] flex items-center justify-center p-4 sm:p-8">
      {/* Главная карточка логина */}
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl flex overflow-hidden min-h-[550px] animate-in zoom-in-95 duration-500">
        
        {/* ЛЕВАЯ ЧАСТЬ (ФОРМА) */}
        <div className="w-full md:w-[45%] lg:w-[40%] p-8 sm:p-12 flex flex-col justify-center bg-white relative z-10">
          
          {/* Логотип / Аватарка (как в референсе) */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-full bg-blue-50 border border-blue-100 shadow-sm flex items-center justify-center mb-4">
              <User size={36} className="text-blue-500" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-wide uppercase">Tender Ulgamy</h1>
            <p className="text-[10px] font-semibold text-slate-400 mt-1 tracking-widest uppercase">Digital Platform</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg flex items-center space-x-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5 text-sm">
            {/* Поле Email/Login */}
            <div>
              <div className="relative">
                <User size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 ml-1" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Email Address / Login"
                  className="w-full pl-8 pr-4 py-3 bg-transparent border-b border-slate-200 focus:border-blue-500 text-slate-800 placeholder-slate-400 transition-colors focus:outline-none"
                />
              </div>
            </div>

            {/* Поле Password */}
            <div>
              <div className="relative">
                <Lock size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 ml-1" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Password"
                  className="w-full pl-8 pr-4 py-3 bg-transparent border-b border-slate-200 focus:border-blue-500 text-slate-800 placeholder-slate-400 transition-colors focus:outline-none"
                />
              </div>
            </div>

            {/* Кнопки */}
            <div className="pt-4 flex flex-col items-center space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-48 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-70 disabled:active:scale-100"
              >
                <span>{loading ? 'Вход...' : 'Login'}</span>
              </button>

              <button type="button" className="text-xs text-slate-400 hover:text-blue-500 font-medium transition-colors">
                Forgot Password?
              </button>
            </div>
          </form>

          {/* Быстрые ссылки снизу */}
          <div className="mt-12 pt-4 border-t border-slate-100">
            <p className="text-[10px] font-semibold text-slate-400 text-center uppercase tracking-wider mb-3">
              Быстрый вход (Demo)
            </p>
            <div className="flex flex-row justify-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-all shadow-sm"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('login123', 'pass123')}
                className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-all shadow-sm"
              >
                Supplier
              </button>
            </div>
          </div>

        </div>

        {/* ПРАВАЯ ЧАСТЬ (ИЛЛЮСТРАЦИЯ) */}
        <div className="hidden md:flex md:w-[55%] lg:w-[60%] bg-[#81ccff] relative overflow-hidden items-center justify-center">
          {/* Сгенерированное изображение */}
          <img 
            src="/assets/login-illustration.jpg" 
            alt="Corporate 3D Isometric illustration" 
            className="w-full h-full object-cover object-center absolute inset-0 opacity-95"
            style={{ mixBlendMode: 'normal' }}
          />
          {/* Легкий накладывающийся градиент, чтобы картинка лучше сливалась с фоном */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent opacity-30 pointer-events-none"></div>
        </div>

      </div>
    </div>
  );
}
