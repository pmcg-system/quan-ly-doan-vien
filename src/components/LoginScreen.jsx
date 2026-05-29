import React, { useState } from 'react';
import { loadAccounts } from './AccountManager';

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTimeout(() => {
      const acc = loadAccounts().find(
        a => a.username === username.trim() && a.password === password
      );
      if (acc) {
        onLogin(acc);
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không đúng!');
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-800 p-4">
      {/* Hiệu ứng nền */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-lg">
              <span className="text-white font-black text-3xl">ĐTN</span>
            </div>
            <h1 className="text-white font-bold text-xl leading-tight mt-1">Sổ Chi Đoàn Bệnh Viện Than - Khoáng Sản</h1>
            <p className="text-blue-200 text-sm mt-1">Hệ thống Quản lý Đoàn viên</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-blue-100 text-sm font-semibold mb-2">Tên đăng nhập</label>
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                placeholder="bvtks-cs1 / bvtks-cs2"
                className="w-full bg-white/10 border border-white/30 text-white placeholder-blue-300 rounded-xl px-4 py-3 outline-none focus:border-white/60 focus:bg-white/20 transition-all"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-blue-100 text-sm font-semibold mb-2">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="w-full bg-white/10 border border-white/30 text-white placeholder-blue-300 rounded-xl px-4 py-3 pr-12 outline-none focus:border-white/60 focus:bg-white/20 transition-all"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-200 hover:text-white transition-colors text-lg"
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/40 text-red-200 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-all shadow-lg shadow-blue-900/30 disabled:opacity-60 mt-2 text-base"
            >
              {loading ? '⏳ Đang xác thực...' : '🔐 Đăng nhập'}
            </button>
          </form>

          {/* Hint */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-blue-300 text-xs">Liên hệ Ban Quản trị để được cấp tài khoản</p>
          </div>
        </div>
      </div>
    </div>
  );
}
