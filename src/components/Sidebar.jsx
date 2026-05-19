import React, { useState } from 'react';
import { LayoutDashboard, Users, FolderOpen, Calendar, Gamepad2, Settings, LogOut, ChevronRight } from 'lucide-react';
import AccountManager from './AccountManager';

const ALL_NAV_ITEMS = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard, adminOnly: false },
  { id: 'members', label: 'Quản lý Đoàn viên', icon: Users, adminOnly: false },
  { id: 'documents', label: 'Quản lý Văn bản', icon: FolderOpen, adminOnly: false },
  { id: 'plans', label: 'Kế hoạch & Báo cáo', icon: Calendar, adminOnly: false },
  { id: 'games', label: 'Trò chơi sinh hoạt', icon: Gamepad2, adminOnly: true },
  { id: 'settings', label: 'Cài đặt', icon: Settings, adminOnly: true },
];

export default function Sidebar({ activeTab, setActiveTab, currentUser, onAppLogout }) {
  const [showAccountManager, setShowAccountManager] = useState(false);
  const isAdmin = currentUser?.role === 'admin';
  const navItems = ALL_NAV_ITEMS.filter(item => !item.adminOnly || isAdmin);

  return (
    <>
      <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0">
        {/* Logo - click về trang chủ */}
        <div
          className="p-6 border-b border-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors group"
          onClick={() => setActiveTab('dashboard')}
          title="Về trang chủ"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-3 shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-xl">ĐTN</span>
            </div>
            <h2 className="font-bold text-gray-800 text-lg leading-tight">Chi đoàn BVTKS - CS2</h2>
            <p className="text-xs text-gray-500 mt-1">Hệ thống Quản lý</p>
          </div>
        </div>

        {/* Nav Items */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card + Đăng xuất */}
        <div className="p-4 border-t border-gray-100">
          {/* Ấn vào user card để mở Account Manager */}
          <button
            onClick={() => setShowAccountManager(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group mb-2 text-left"
            title="Quản lý tài khoản"
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${isAdmin ? 'bg-blue-600' : 'bg-gray-400'}`}>
              {currentUser?.displayName?.[0] || 'G'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-800 truncate">{currentUser?.displayName}</p>
              <p className={`text-xs font-medium ${isAdmin ? 'text-blue-500' : 'text-gray-400'}`}>
                {isAdmin ? '👑 Quản trị viên' : '👁 Chỉ xem'}
              </p>
            </div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
          </button>

          <button
            onClick={onAppLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất hệ thống
          </button>
        </div>
      </div>

      {/* Modal quản lý tài khoản */}
      {showAccountManager && (
        <AccountManager
          currentUser={currentUser}
          onClose={() => setShowAccountManager(false)}
        />
      )}
    </>
  );
}
