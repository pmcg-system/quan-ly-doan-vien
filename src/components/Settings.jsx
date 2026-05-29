import React, { useRef } from 'react';
import { Btn, SectionDivider } from './UI';
import { RAW_MEMBERS, INIT_PLANS, INIT_QUESTIONS, getBranchConfig } from '../data/constants';

export default function Settings({ geminiApiKey, setGeminiApiKey, syncStatus, currentUser }) {
  const config = getBranchConfig(currentUser?.username);
  const [apiUrlVal, setApiUrlVal] = React.useState(config.apiUrl);
  const [folderDenVal, setFolderDenVal] = React.useState(config.folderDen);
  const [folderDiVal, setFolderDiVal] = React.useState(config.folderDi);
  const [folderKeHoachVal, setFolderKeHoachVal] = React.useState(config.folderKeHoach);
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, color: "#1a1a2e" }}>⚙️ Cài đặt hệ thống</h2>
        <p style={{ margin: "4px 0 0", color: "#888", fontSize: 13 }}>Tùy chỉnh hệ thống và quản lý dữ liệu</p>
      </div>

      <div style={{ maxWidth: 720 }}>

        {/* CSDL API Status Card */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: 18 }}>
          <SectionDivider label="Kết nối Cơ sở dữ liệu đám mây" />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#00b4d8,#0077b6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20 }}>☁️</div>
              <div>
                <div style={{ fontWeight: 700, color: "#1a1a2e", fontSize: 15 }}>Hệ thống Google Apps Script API</div>
                <div style={{ fontSize: 12, color: syncStatus.includes('Lỗi') || syncStatus.includes('Chưa') ? '#dc2626' : '#0077b6', fontWeight: 600, marginTop: 2 }}>
                  Trạng thái: {syncStatus}
                </div>
              </div>
            </div>
            <button
                onClick={() => window.location.reload()}
                style={{ padding: "8px 18px", borderRadius: 9, border: "none", background: "#e0f2fe", color: "#0284c7", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
              >
                Đồng bộ lại
            </button>
          </div>
        </div>

        {/* Cấu hình nâng cao cho Chi đoàn */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: 18 }}>
          <SectionDivider label="Cấu hình Chi đoàn (Google Apps Script & Drive)" />
          <div style={{ paddingTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontWeight: 600, color: "#1a1a2e", fontSize: 14, marginBottom: 4 }}>URL Google Apps Script API</div>
              <input 
                type="text" 
                value={apiUrlVal} 
                onChange={e => setApiUrlVal(e.target.value)} 
                placeholder="Chưa cấu hình. VD: https://script.google.com/macros/s/.../exec"
                style={{ width: "100%", padding: "10px 14px", border: "1px solid #ddd", borderRadius: 8, outline: "none", fontSize: 14 }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 600, color: "#1a1a2e", fontSize: 13, marginBottom: 4 }}>Thư mục Văn bản đến</div>
                <input 
                  type="text" 
                  value={folderDenVal} 
                  onChange={e => setFolderDenVal(e.target.value)} 
                  placeholder="ID Thư mục Drive"
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #ddd", borderRadius: 8, outline: "none", fontSize: 13 }}
                />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: "#1a1a2e", fontSize: 13, marginBottom: 4 }}>Thư mục Văn bản đi</div>
                <input 
                  type="text" 
                  value={folderDiVal} 
                  onChange={e => setFolderDiVal(e.target.value)} 
                  placeholder="ID Thư mục Drive"
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #ddd", borderRadius: 8, outline: "none", fontSize: 13 }}
                />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: "#1a1a2e", fontSize: 13, marginBottom: 4 }}>Thư mục Kế hoạch</div>
                <input 
                  type="text" 
                  value={folderKeHoachVal} 
                  onChange={e => setFolderKeHoachVal(e.target.value)} 
                  placeholder="ID Thư mục Drive"
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #ddd", borderRadius: 8, outline: "none", fontSize: 13 }}
                />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button 
                onClick={() => {
                  const key_prefix = currentUser?.username || 'bvtks-cs2';
                  localStorage.setItem(`api_url_${key_prefix}`, apiUrlVal.trim());
                  localStorage.setItem(`folder_den_${key_prefix}`, folderDenVal.trim());
                  localStorage.setItem(`folder_di_${key_prefix}`, folderDiVal.trim());
                  localStorage.setItem(`folder_ke_hoach_${key_prefix}`, folderKeHoachVal.trim());
                  alert("Đã lưu cấu hình thành công! Trình duyệt sẽ tải lại để cập nhật kết nối.");
                  window.location.reload();
                }}
                style={{ padding: "10px 24px", background: "#0284c7", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13 }}
              >
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>

        {/* AI & Gemini API Key */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: 18 }}>
          <SectionDivider label="Cấu hình Trí tuệ Nhân tạo (Google Gemini)" />
          <div style={{ paddingTop: 14 }}>
            <div style={{ fontWeight: 600, color: "#1a1a2e", fontSize: 15, marginBottom: 4 }}>Khóa truy cập API (API Key)</div>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>
              Dùng để AI tự động soạn thảo bộ câu hỏi trắc nghiệm. Lấy miễn phí tại <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: "#2563eb", textDecoration: "none" }}>aistudio.google.com</a>.
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <input 
                type="password" 
                value={geminiApiKey} 
                onChange={e => {
                  setGeminiApiKey(e.target.value);
                  localStorage.setItem('geminiApiKey', e.target.value);
                }}
                placeholder="Nhập AIzaSy..." 
                style={{ flex: 1, padding: "10px 14px", border: "1px solid #ddd", borderRadius: 8, outline: "none", fontSize: 14 }}
              />
              <button 
                onClick={() => {
                  if (geminiApiKey) {
                    alert("Đã lưu API Key vào trình duyệt!");
                  } else {
                    alert("Vui lòng nhập API Key.");
                  }
                }}
                style={{ padding: "0 20px", background: "#f8f9fa", border: "1px solid #ddd", borderRadius: 8, cursor: "pointer", fontWeight: 600, color: "#333" }}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: 18 }}>
          <SectionDivider label="Quản lý Dữ liệu" />
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #f5f5f5" }}>
            <div>
              <div style={{ fontWeight: 700, color: "#1a1a2e", fontSize: 14 }}>Sao lưu dữ liệu (Export)</div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>Tải xuống toàn bộ dữ liệu hiện tại về máy tính dưới định dạng JSON</div>
            </div>
            <Btn v="s" onClick={async () => {
              if (!config.apiUrl) {
                alert("Chưa cấu hình Google Apps Script URL!");
                return;
              }
              try {
                const res = await fetch(config.apiUrl);
                const data = await res.json();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `backup_${currentUser?.username || 'quanlydoanvien'}_${new Date().toISOString().split('T')[0]}.json`;
                link.click();
              } catch (e) {
                alert("Lỗi khi tải dữ liệu sao lưu: " + e.message);
              }
            }}>Tải xuống bản sao lưu</Btn>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #f5f5f5" }}>
            <div>
              <div style={{ fontWeight: 700, color: "#1a1a2e", fontSize: 14 }}>Phục hồi dữ liệu (Import)</div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>Khôi phục hệ thống từ file JSON sao lưu trước đó</div>
            </div>
            <label style={{ display: "inline-flex", alignItems: "center", padding: "8px 18px", borderRadius: 9, border: "none", background: "#e0f2fe", color: "#0284c7", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
              Chọn file sao lưu
              <input 
                type="file" 
                accept=".json" 
                style={{ display: "none" }} 
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  if (!config.apiUrl) {
                    alert("Chưa cấu hình Google Apps Script URL!");
                    return;
                  }
                  if (window.confirm("Cảnh báo: Dữ liệu hiện tại sẽ bị GHI ĐÈ hoàn toàn bởi file này. Bạn có chắc chắn?")) {
                    const reader = new FileReader();
                    reader.onload = async (evt) => {
                      try {
                        const content = JSON.parse(evt.target.result);
                        if (!content.members) throw new Error("File không đúng định dạng sao lưu.");
                        
                        alert("Đang đồng bộ dữ liệu lên máy chủ, vui lòng đợi vài giây...");
                        await fetch(config.apiUrl, {
                          method: 'POST',
                          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                          body: JSON.stringify(content)
                        });
                        alert("Phục hồi thành công! Trình duyệt sẽ tải lại.");
                        window.location.reload();
                      } catch (err) {
                        alert("Lỗi phục hồi: " + err.message);
                      }
                    };
                    reader.readAsText(file);
                  }
                  e.target.value = '';
                }} 
              />
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14 }}>
            <div>
              <div style={{ fontWeight: 700, color: "#c1121f", fontSize: 14 }}>Khôi phục cài đặt gốc</div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>Xóa trắng toàn bộ dữ liệu (trở về trạng thái ban đầu). Thao tác này không thể hoàn tác!</div>
            </div>
            <Btn v="d" onClick={async () => {
              if (!config.apiUrl) {
                alert("Chưa cấu hình Google Apps Script URL!");
                return;
              }
              if (window.confirm("CẢNH BÁO NGUY HIỂM: \nBạn có chắc chắn muốn XÓA TRẮNG toàn bộ dữ liệu hệ thống (Đoàn viên, Kế hoạch, Quỹ, Trắc nghiệm) không?")) {
                if (window.confirm("Thao tác này KHÔNG THỂ HOÀN TÁC! Bạn có thực sự muốn xóa?")) {
                  try {
                    const emptyData = {
                      members: RAW_MEMBERS,
                      plans: INIT_PLANS,
                      questions: INIT_QUESTIONS,
                      funds: []
                    };
                    await fetch(config.apiUrl, {
                      method: 'POST',
                      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                      body: JSON.stringify(emptyData)
                    });
                    alert("Đã khôi phục cài đặt gốc thành công! Trình duyệt sẽ tải lại.");
                    window.location.reload();
                  } catch (e) {
                    alert("Lỗi khi xóa dữ liệu: " + e.message);
                  }
                }
              }
            }}>Xóa dữ liệu</Btn>
          </div>
        </div>

        {/* System Info */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
          <SectionDivider label="Thông tin hệ thống" />
          <div style={{ paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              ["Phiên bản", "v1.0.0"],
              ["Nhà phát triển", "Antigravity AI"],
              ["Đơn vị sử dụng", "Chi đoàn Trung tâm y tế Than khu vực Mạo Khê"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid #f9f9f9" }}>
                <span style={{ color: "#999" }}>{k}</span>
                <span style={{ fontWeight: 600, color: "#1a1a2e" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
