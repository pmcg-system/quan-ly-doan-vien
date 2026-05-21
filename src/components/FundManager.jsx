import React, { useState } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Btn, Td, Th } from './UI';

export default function FundManager({ funds, setFunds, isAdmin }) {
  const [showForm, setShowForm] = useState(false);
  const [newFund, setNewFund] = useState({ date: new Date().toISOString().split('T')[0], type: 'thu', amount: '', description: '' });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newFund.amount || !newFund.description) return;
    
    const nextId = funds.length > 0 ? Math.max(...funds.map(f => f.id)) + 1 : 1;
    const added = { ...newFund, id: nextId, amount: parseInt(newFund.amount, 10) };
    
    setFunds([...funds, added]);
    setShowForm(false);
    setNewFund({ date: new Date().toISOString().split('T')[0], type: 'thu', amount: '', description: '' });
  };

  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa giao dịch này?")) {
      setFunds(funds.filter(f => f.id !== id));
    }
  };

  // Sort funds by date descending for display, but ascending for calculation
  const sortedFunds = [...funds].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  let currentBalance = 0;
  const fundsWithBalance = sortedFunds.map(f => {
    if (f.type === 'thu') currentBalance += f.amount;
    else currentBalance -= f.amount;
    return { ...f, balance: currentBalance };
  }).reverse(); // Reverse for display (newest first)

  const totalIncome = funds.filter(f => f.type === 'thu').reduce((sum, f) => sum + f.amount, 0);
  const totalExpense = funds.filter(f => f.type === 'chi').reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Quản lý Thu/Chi</h2>
          <p className="text-gray-500 text-sm mt-1">Theo dõi quỹ đoàn phí và các khoản chi</p>
        </div>
        {isAdmin && (
          <Btn onClick={() => setShowForm(!showForm)}>
            <Plus size={18} /> Thêm Giao dịch
          </Btn>
        )}
      </div>

      {/* Thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Wallet size={24} />
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Tồn quỹ hiện tại</div>
            <div className="text-2xl font-bold text-gray-800">{currentBalance.toLocaleString()} đ</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Tổng thu</div>
            <div className="text-2xl font-bold text-green-600">+{totalIncome.toLocaleString()} đ</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
            <TrendingDown size={24} />
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Tổng chi</div>
            <div className="text-2xl font-bold text-red-600">-{totalExpense.toLocaleString()} đ</div>
          </div>
        </div>
      </div>

      {showForm && isAdmin && (
        <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-md animate-fade-in-down">
          <h3 className="font-bold text-gray-800 mb-4">Thêm giao dịch mới</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ngày tháng</label>
              <input type="date" className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" value={newFund.date} onChange={e => setNewFund({...newFund, date: e.target.value})} required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Loại</label>
              <select className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" value={newFund.type} onChange={e => setNewFund({...newFund, type: e.target.value})}>
                <option value="thu">Khoản Thu</option>
                <option value="chi">Khoản Chi</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Số tiền (VNĐ)</label>
              <input type="number" min="0" className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" placeholder="Ví dụ: 500000" value={newFund.amount} onChange={e => setNewFund({...newFund, amount: e.target.value})} required />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Nội dung</label>
              <div className="flex gap-2">
                <input type="text" className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" placeholder="Nội dung thu/chi..." value={newFund.description} onChange={e => setNewFund({...newFund, description: e.target.value})} required />
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 whitespace-nowrap transition-colors shadow-sm">Lưu</button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <Th>Ngày tháng</Th>
                <Th>Loại</Th>
                <Th>Nội dung</Th>
                <Th>Số tiền</Th>
                <Th>Quỹ còn lại</Th>
                {isAdmin && <Th>Thao tác</Th>}
              </tr>
            </thead>
            <tbody>
              {fundsWithBalance.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="text-center p-8 text-gray-400 italic">Chưa có dữ liệu thu/chi</td>
                </tr>
              ) : (
                fundsWithBalance.map((fund) => (
                  <tr key={fund.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <Td>{new Date(fund.date).toLocaleDateString('vi-VN')}</Td>
                    <Td>
                      <span className={`px-2 py-1 text-xs font-bold rounded-md ${fund.type === 'thu' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {fund.type === 'thu' ? 'Thu' : 'Chi'}
                      </span>
                    </Td>
                    <Td>{fund.description}</Td>
                    <Td>
                      <span className={`font-semibold ${fund.type === 'thu' ? 'text-green-600' : 'text-red-600'}`}>
                        {fund.type === 'thu' ? '+' : '-'}{fund.amount.toLocaleString()} đ
                      </span>
                    </Td>
                    <Td><span className="font-bold text-gray-800">{fund.balance.toLocaleString()} đ</span></Td>
                    {isAdmin && (
                      <Td>
                        <button onClick={() => handleDelete(fund.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </Td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
