import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, KeyRound, Eye, EyeOff, Shield, User, RefreshCw } from 'lucide-react';

const STORAGE_KEY = 'app_accounts';

const DEFAULT_ACCOUNTS = [
  { username: 'bvtks-cs1', password: 'admin@123', role: 'admin', displayName: 'Chi đoàn Bệnh viện Than Khoáng sản CS1' },
  { username: 'bvtks-cs2', password: 'admin@123', role: 'admin', displayName: 'Chi đoàn Bệnh viện Than Khoáng sản CS2' },
];

// Xuất hàm load accounts để LoginScreen dùng
export function loadAccounts() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved || saved.includes('"admin"') || saved.includes('"guest"')) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
    return DEFAULT_ACCOUNTS;
  }
  return JSON.parse(saved);
}

function saveAccounts(accounts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

function generatePassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789@#!';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function AccountManager({ currentUser, onClose }) {
  const [accounts, setAccounts] = useState(loadAccounts);
  const [activeSection, setActiveSection] = useState('list'); // list | change_pass | add
  const [showPassMap, setShowPassMap] = useState({});
  const [toast, setToast] = useState(null);

  // Form đổi mật khẩu
  const [cpOld, setCpOld] = useState('');
  const [cpNew, setCpNew] = useState('');
  const [cpConfirm, setCpConfirm] = useState('');

  // Form thêm tài khoản
  const [newUser, setNewUser] = useState({ username: '', password: '', displayName: '', role: 'guest' });

  const isAdmin = currentUser?.role === 'admin';

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveAccounts = (updated) => {
    setAccounts(updated);
    saveAccounts(updated);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    const me = accounts.find(a => a.username === currentUser.username);
    if (!me || me.password !== cpOld) { showToast('Mật khẩu cũ không đúng!', 'error'); return; }
    if (cpNew.length < 6) { showToast('Mật khẩu mới phải có ít nhất 6 ký tự!', 'error'); return; }
    if (cpNew !== cpConfirm) { showToast('Xác nhận mật khẩu không khớp!', 'error'); return; }
    const updated = accounts.map(a => a.username === currentUser.username ? { ...a, password: cpNew } : a);
    handleSaveAccounts(updated);
    setCpOld(''); setCpNew(''); setCpConfirm('');
    showToast('✅ Đổi mật khẩu thành công!');
  };

  const handleResetPassword = (username) => {
    const newPass = generatePassword();
    const updated = accounts.map(a => a.username === username ? { ...a, password: newPass } : a);
    handleSaveAccounts(updated);
    showToast(`🔑 Mật khẩu mới của "${username}": ${newPass}`, 'info');
  };

  const handleAddAccount = (e) => {
    e.preventDefault();
    if (!newUser.username.trim() || !newUser.password.trim() || !newUser.displayName.trim()) {
      showToast('Vui lòng điền đầy đủ thông tin!', 'error'); return;
    }
    if (accounts.find(a => a.username === newUser.username.trim())) {
      showToast('Tên đăng nhập đã tồn tại!', 'error'); return;
    }
    const updated = [...accounts, { ...newUser, username: newUser.username.trim() }];
    handleSaveAccounts(updated);
    setNewUser({ username: '', password: '', displayName: '', role: 'guest' });
    showToast('✅ Đã tạo tài khoản thành công!');
    setActiveSection('list');
  };

  const handleDelete = (username) => {
    if (username === 'bvtks-cs1' || username === 'bvtks-cs2') {
      showToast('Không thể xóa tài khoản mặc định của hệ thống!', 'error');
      return;
    }
    if (username === currentUser.username) { showToast('Không thể xóa tài khoản đang đăng nhập!', 'error'); return; }
    if (accounts.filter(a => a.role === 'admin').length === 1 && accounts.find(a => a.username === username)?.role === 'admin') {
      showToast('Phải có ít nhất 1 tài khoản Admin!', 'error'); return;
    }
    if (!window.confirm(`Xóa tài khoản "${username}"?`)) return;
    handleSaveAccounts(accounts.filter(a => a.username !== username));
    showToast('Đã xóa tài khoản.');
  };

  const toggleShowPass = (username) => setShowPassMap(p => ({ ...p, [username]: !p[username] }));

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">⚙️ Quản lý Tài khoản</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`mx-6 mt-4 px-4 py-3 rounded-xl text-sm font-medium ${
            toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
            toast.type === 'info' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
            'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {toast.msg}
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex gap-2 px-6 pt-4">
          <button
            onClick={() => setActiveSection('change_pass')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeSection === 'change_pass' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <KeyRound size={15} /> Đổi mật khẩu
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => setActiveSection('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeSection === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <Shield size={15} /> Danh sách
              </button>
              <button
                onClick={() => setActiveSection('add')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeSection === 'add' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <Plus size={15} /> Tạo mới
              </button>
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

          {/* ĐỔI MẬT KHẨU */}
          {activeSection === 'change_pass' && (
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm mx-auto mt-2">
              <p className="text-sm text-gray-500 text-center mb-4">Đổi mật khẩu cho tài khoản <strong>{currentUser?.displayName}</strong></p>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">Mật khẩu hiện tại</label>
                <input type="password" value={cpOld} onChange={e => setCpOld(e.target.value)} className={inputCls} placeholder="Nhập mật khẩu cũ" required />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">Mật khẩu mới (tối thiểu 6 ký tự)</label>
                <input type="password" value={cpNew} onChange={e => setCpNew(e.target.value)} className={inputCls} placeholder="Nhập mật khẩu mới" required />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">Xác nhận mật khẩu mới</label>
                <input type="password" value={cpConfirm} onChange={e => setCpConfirm(e.target.value)} className={inputCls} placeholder="Nhập lại mật khẩu mới" required />
              </div>
              <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
                💾 Lưu mật khẩu mới
              </button>
            </form>
          )}

          {/* DANH SÁCH TÀI KHOẢN */}
          {activeSection === 'list' && isAdmin && (
            <div className="space-y-3">
              {accounts.map(acc => (
                <div key={acc.username} className={`p-4 rounded-xl border ${acc.username === currentUser.username ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${acc.role === 'admin' ? 'bg-blue-600' : 'bg-gray-400'}`}>
                        {acc.displayName?.[0] || acc.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{acc.displayName}</p>
                        <p className="text-xs text-gray-400">@{acc.username} · {acc.role === 'admin' ? '👑 Admin' : '👁 Guest'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResetPassword(acc.username)}
                        title="Cấp lại mật khẩu ngẫu nhiên"
                        className="p-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                      >
                        <RefreshCw size={14} />
                      </button>
                      {acc.username !== currentUser.username && (
                        <button
                          onClick={() => handleDelete(acc.username)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Hiện mật khẩu */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">Mật khẩu:</span>
                    <code className="text-xs font-mono bg-white px-2 py-0.5 rounded border border-gray-200">
                      {showPassMap[acc.username] ? acc.password : '••••••••'}
                    </code>
                    <button onClick={() => toggleShowPass(acc.username)} className="text-gray-400 hover:text-gray-600">
                      {showPassMap[acc.username] ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* THÊM TÀI KHOẢN */}
          {activeSection === 'add' && isAdmin && (
            <form onSubmit={handleAddAccount} className="space-y-4 max-w-sm mx-auto mt-2">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">Tên hiển thị</label>
                <input value={newUser.displayName} onChange={e => setNewUser(p => ({ ...p, displayName: e.target.value }))} className={inputCls} placeholder="VD: Nguyễn Văn A" required />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">Tên đăng nhập</label>
                <input value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value.toLowerCase().replace(/\s/g,'') }))} className={inputCls} placeholder="VD: nguyenvana (không dấu, không cách)" required />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">Mật khẩu ban đầu</label>
                <div className="flex gap-2">
                  <input value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} className={inputCls} placeholder="Tối thiểu 6 ký tự" required />
                  <button type="button" onClick={() => setNewUser(p => ({ ...p, password: generatePassword() }))} className="px-3 py-2 bg-gray-100 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200 whitespace-nowrap">
                    🎲 Tự tạo
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">Vai trò</label>
                <select value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))} className={inputCls}>
                  <option value="guest">👁 Guest – Chỉ xem</option>
                  <option value="admin">👑 Admin – Toàn quyền</option>
                </select>
              </div>
              <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
                ➕ Tạo tài khoản
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
