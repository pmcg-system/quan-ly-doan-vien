import React, { useState } from 'react';
import { CheckCircle, Award, ListChecks } from 'lucide-react';
import { Btn, Td, Th } from './UI';
import { XEP_LOAI_LIST } from '../data/constants';

export default function AttendanceManager({ members, setMembers, plans, setPlans, isAdmin }) {
  const [activeTab, setActiveTab] = useState('attendance'); // attendance, evaluation
  const [selectedPlanId, setSelectedPlanId] = useState(plans.length > 0 ? plans[0].id : null);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedPlan = plans.find(p => p.id === parseInt(selectedPlanId, 10));
  const planAttendees = selectedPlan?.attendees || [];

  const handleToggleAttendance = (memberId) => {
    if (!isAdmin || !selectedPlan) return;
    
    const isAttending = planAttendees.includes(memberId);
    let newAttendees;
    
    if (isAttending) {
      newAttendees = planAttendees.filter(id => id !== memberId);
    } else {
      newAttendees = [...planAttendees, memberId];
    }
    
    const newPlans = plans.map(p => p.id === selectedPlan.id ? { ...p, attendees: newAttendees } : p);
    setPlans(newPlans);
  };

  const handleUpdateRating = (memberId, newRating) => {
    if (!isAdmin) return;
    const newMembers = members.map(m => m.id === memberId ? { ...m, xepLoai: newRating } : m);
    setMembers(newMembers);
  };

  const isInactive = (m) => m.trangThai && m.trangThai !== 'active' && m.trangThai !== 'chuyen_den';

  const filteredMembers = members
    .filter(m => !isInactive(m))
    .filter(m => m.hoTen.toLowerCase().includes(searchQuery.toLowerCase()) || m.toDoan.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Điểm danh & Đánh giá</h2>
          <p className="text-gray-500 text-sm mt-1">Quản lý tham gia phong trào và xếp loại đoàn viên</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 mb-6">
        <button 
          onClick={() => setActiveTab('attendance')} 
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all border-b-2 ${activeTab === 'attendance' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
        >
          <ListChecks size={18} /> Điểm danh Hoạt động
        </button>
        <button 
          onClick={() => setActiveTab('evaluation')} 
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all border-b-2 ${activeTab === 'evaluation' ? 'border-purple-600 text-purple-600 bg-purple-50/50' : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
        >
          <Award size={18} /> Tổng kết & Xếp loại
        </button>
      </div>

      {activeTab === 'attendance' && (
        <div className="space-y-4">
          {plans.length === 0 ? (
            <div className="bg-yellow-50 text-yellow-700 p-6 rounded-2xl border border-yellow-200 text-center">
              Chưa có kế hoạch/hoạt động nào. Vui lòng tạo kế hoạch trước ở tab "Kế hoạch & Báo cáo".
            </div>
          ) : (
            <>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Chọn Hoạt động / Kế hoạch:</label>
                  <select 
                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none"
                    value={selectedPlanId || ''}
                    onChange={e => setSelectedPlanId(e.target.value)}
                  >
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.title} ({p.startDate})</option>
                    ))}
                  </select>
                </div>
                <div className="w-full md:w-auto text-center md:text-right">
                  <div className="text-sm text-gray-500">Số người tham gia:</div>
                  <div className="text-2xl font-bold text-blue-600">{planAttendees.length} / {members.filter(m => !isInactive(m)).length}</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <input 
                    type="text" 
                    placeholder="Tìm kiếm đoàn viên..." 
                    className="w-full border border-gray-200 p-2 rounded-lg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <Th>Trạng thái</Th>
                        <Th>Họ tên</Th>
                        <Th>Chi đoàn</Th>
                        <Th>Chức vụ</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map(m => {
                        const isAttending = planAttendees.includes(m.id);
                        return (
                          <tr key={m.id} className={`border-b border-gray-50 hover:bg-blue-50/30 cursor-pointer transition-colors ${isAttending ? 'bg-blue-50/10' : ''}`} onClick={() => handleToggleAttendance(m.id)}>
                            <Td>
                              <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${isAttending ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}>
                                {isAttending && <CheckCircle size={16} />}
                              </div>
                            </Td>
                            <Td>
                              <span className={`font-semibold ${isAttending ? 'text-blue-800' : 'text-gray-800'}`}>{m.hoTen}</span>
                            </Td>
                            <Td><span className="text-sm text-gray-600">{m.toDoan}</span></Td>
                            <Td><span className="text-sm text-gray-600">{m.chucVu}</span></Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'evaluation' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <input 
                type="text" 
                placeholder="Tìm kiếm đoàn viên..." 
                className="w-full md:w-1/3 border border-gray-200 p-2 rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="text-sm text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full">Tổng: {members.filter(m => !isInactive(m)).length} đoàn viên đang sinh hoạt</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <Th>Họ tên</Th>
                    <Th>Chi đoàn</Th>
                    <Th className="text-center">Số hoạt động tham gia</Th>
                    <Th>Đánh giá & Xếp loại</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map(m => {
                    const count = getAttendanceCount(m.id, plans);
                    return (
                      <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <Td><span className="font-bold text-gray-800">{m.hoTen}</span></Td>
                        <Td><span className="text-sm text-gray-600">{m.toDoan}</span></Td>
                        <Td className="text-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${count > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {count}
                          </span>
                        </Td>
                        <Td>
                          {isAdmin ? (
                            <select 
                              className={`border p-2 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-100 ${
                                m.xepLoai === 'Xuất sắc' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                                m.xepLoai === 'Tốt' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                                m.xepLoai === 'Khá' ? 'bg-green-50 text-green-700 border-green-200' : 
                                m.xepLoai === 'Chưa đánh giá' ? 'bg-gray-50 text-gray-500 border-gray-200' :
                                'bg-orange-50 text-orange-700 border-orange-200'
                              }`}
                              value={m.xepLoai || 'Chưa đánh giá'}
                              onChange={(e) => handleUpdateRating(m.id, e.target.value)}
                            >
                              {XEP_LOAI_LIST.map(xl => <option key={xl} value={xl}>{xl}</option>)}
                            </select>
                          ) : (
                            <span className="text-sm font-bold text-gray-700">{m.xepLoai || 'Chưa đánh giá'}</span>
                          )}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Bổ sung hàm getAttendanceCount ở cuối file
function getAttendanceCount(memberId, plans) {
  return plans.filter(p => p.attendees && p.attendees.includes(memberId)).length;
}
