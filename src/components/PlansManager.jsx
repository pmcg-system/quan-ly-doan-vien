import React, { useState, useRef } from 'react';
import { Modal, FI, FS, FT, Btn } from './UI';
import { RED, GREEN, GOLD, NAVY, TEAL } from '../data/constants';

const FOLDER_KE_HOACH = import.meta.env.VITE_FOLDER_KE_HOACH || '';

async function uploadFileToDrive(file, accessToken) {
  const metadata = {
    name: file.name,
    parents: [FOLDER_KE_HOACH],
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    }
  );

  if (!res.ok) throw new Error('Upload thất bại: ' + res.statusText);
  return await res.json(); // { id, name, webViewLink, webContentLink }
}

export default function PlansManager({ plans, setPlans, accessToken, onNeedLogin, isAdmin }) {
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState(null); // file object chưa upload
  const [form, setForm] = useState({
    title: '', category: 'Sinh hoạt', startDate: '', endDate: '',
    status: 'Kế hoạch', responsible: '', description: '', attachment: null
  });

  const cc = { 'Sinh hoạt': RED, 'Tình nguyện': GREEN, 'Khởi nghiệp': GOLD, 'Giáo dục': NAVY, 'Thể thao': TEAL };
  const sc = { 'Hoàn thành': GREEN, 'Đang thực hiện': GOLD, 'Kế hoạch': '#aaa' };

  const resetForm = () => {
    setForm({ title: '', category: 'Sinh hoạt', startDate: '', endDate: '', status: 'Kế hoạch', responsible: '', description: '', attachment: null });
    setPendingFile(null);
  };

  const handleSave = async () => {
    if (!form.title) return;
    setUploading(true);
    try {
      let attachment = null;
      if (pendingFile) {
        if (!accessToken) {
          alert('Bạn cần đăng nhập Google tại tab Cài đặt trước khi tải file lên Drive!');
          setUploading(false);
          return;
        }
        const driveFile = await uploadFileToDrive(pendingFile, accessToken);
        attachment = {
          name: driveFile.name,
          fileId: driveFile.id,
          viewUrl: driveFile.webViewLink,
          downloadUrl: driveFile.webContentLink,
        };
      }
      setPlans(prev => [{ ...form, id: Date.now(), attachment }, ...prev]);
      setShowForm(false);
      resetForm();
    } catch (err) {
      alert('Lỗi tải file lên Drive: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 22, color: '#1a1a2e' }}>📋 Kế hoạch hoạt động</h2>
        {isAdmin && <Btn onClick={() => setShowForm(true)}>+ Thêm kế hoạch</Btn>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
        {plans.map(p => (
          <div key={p.id} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <div style={{ background: cc[p.category] || RED, padding: '14px 18px', color: '#fff' }}>
              <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{p.category}</div>
              <div style={{ fontWeight: 700, fontSize: 15, marginTop: 4, lineHeight: 1.4 }}>{p.title}</div>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 12, color: '#aaa', marginBottom: 8 }}>📅 {p.startDate} → {p.endDate}</div>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: '#666', lineHeight: 1.6 }}>{p.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ padding: '3px 10px', borderRadius: 20, background: sc[p.status] || '#aaa', color: '#fff', fontSize: 11, fontWeight: 700 }}>{p.status}</span>
                <span style={{ fontSize: 12, color: '#aaa' }}>👤 {p.responsible}</span>
              </div>
              {p.attachment && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #eee' }}>
                  <div style={{ fontSize: 12, color: '#555', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span>📎</span>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.attachment.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a
                      href={p.attachment.viewUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: 11, padding: '5px 12px', background: '#f0f0f0', color: '#333', borderRadius: 6, textDecoration: 'none', fontWeight: 700 }}
                    >
                      👁 Xem
                    </a>
                    <a
                      href={p.attachment.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: 11, padding: '5px 12px', background: '#eef2ff', color: '#4f46e5', borderRadius: 6, textDecoration: 'none', fontWeight: 700 }}
                    >
                      ⬇ Tải về
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <Modal title="Thêm kế hoạch mới" onClose={() => { setShowForm(false); resetForm(); }}>
          <FI label="Tên hoạt động *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Nhập tên hoạt động..." />
          <FS label="Danh mục" opts={['Sinh hoạt', 'Tình nguyện', 'Khởi nghiệp', 'Giáo dục', 'Thể thao']} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FI label="Ngày bắt đầu" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
            <FI label="Ngày kết thúc" type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <FS label="Trạng thái" opts={['Kế hoạch', 'Đang thực hiện', 'Hoàn thành']} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} />
          <FI label="Người phụ trách" value={form.responsible} onChange={e => setForm({ ...form, responsible: e.target.value })} />
          <FT label="Mô tả" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />

          {/* File Upload */}
          <div style={{ marginBottom: 11 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Đính kèm tệp tin (Google Drive)
            </label>
            {!accessToken ? (
              <div style={{ padding: '10px 14px', border: '1.5px dashed #f4a261', borderRadius: 8, background: '#fffbf5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#888' }}>⚠️ Cần đăng nhập Google để đính kèm file lên Drive</span>
                <button onClick={() => { setShowForm(false); onNeedLogin(); }} style={{ fontSize: 11, padding: '4px 12px', background: '#4285F4', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>
                  Đi tới Cài đặt
                </button>
              </div>
            ) : (
              <div style={{ border: '1.5px dashed #ccc', borderRadius: 8, background: '#fafafa', padding: '10px 14px' }}>
                <input
                  type="file"
                  onChange={e => setPendingFile(e.target.files[0] || null)}
                  style={{ fontSize: 13, width: '100%' }}
                />
                {pendingFile && (
                  <div style={{ marginTop: 6, fontSize: 12, color: '#34A853', fontWeight: 600 }}>
                    ✅ Đã chọn: {pendingFile.name} ({(pendingFile.size / 1024).toFixed(1)} KB) — Sẽ tải lên Drive khi Lưu
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14, paddingTop: 10, borderTop: '1px solid #eee' }}>
            <Btn v="s" onClick={() => { setShowForm(false); resetForm(); }}>Hủy</Btn>
            <Btn onClick={handleSave} disabled={uploading}>
              {uploading ? '⏳ Đang tải lên Drive...' : '💾 Lưu kế hoạch'}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
