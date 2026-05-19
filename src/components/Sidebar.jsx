import React from 'react';
import { LayoutDashboard, Users, FolderOpen, Calendar, Gamepad2, Settings, LogOut } from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'members', label: 'Quản lý Đoàn viên', icon: Users },
  { id: 'documents', label: 'Quản lý Văn bản', icon: FolderOpen },
  { id: 'plans', label: 'Kế hoạch & Công trình', icon: Calendar },
  { id: 'games', label: 'Trò chơi sinh hoạt', icon: Gamepad2 },
  { id: 'settings', label: 'Cài đặt', icon: Settings },
];

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-3 shadow-lg shadow-blue-200">
            <span className="text-white font-bold text-xl">ĐTN</span>
          </div>
          <h2 className="font-bold text-gray-800 text-lg leading-tight">Chi đoàn TTYT Than KV Mạo Khê</h2>
          <p className="text-xs text-gray-500 mt-1">Hệ thống Quản lý</p>
        </div>
      </div>
      
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
    </div>
  );
}
