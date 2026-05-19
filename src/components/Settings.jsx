import React from 'react';
import { Btn, SectionDivider } from './UI';

export default function Settings({ accessToken, login, logout, geminiApiKey, setGeminiApiKey }) {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, color: "#1a1a2e" }}>⚙️ Cài đặt hệ thống</h2>
        <p style={{ margin: "4px 0 0", color: "#888", fontSize: 13 }}>Tùy chỉnh hệ thống và quản lý dữ liệu</p>
      </div>

      <div style={{ maxWidth: 720 }}>

        {/* Google Account Card */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: 18 }}>
          <SectionDivider label="Tài khoản Google (Google Drive)" />
          {accessToken ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#4285F4,#34A853)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20 }}>G</div>
                <div>
                  <div style={{ fontWeight: 700, color: "#1a1a2e", fontSize: 15 }}>Đã kết nối Google Drive</div>
                  <div style={{ fontSize: 12, color: "#34A853", fontWeight: 600, marginTop: 2 }}>✅ Tab Văn bản và Kế hoạch có thể tải lên file</div>
                </div>
              </div>
              <button
                onClick={logout}
                style={{ padding: "8px 18px", borderRadius: 9, border: "none", background: "#ffeef0", color: "#c1121f", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14 }}>
              <div>
                <div style={{ fontWeight: 600, color: "#1a1a2e", fontSize: 15 }}>Chưa đăng nhập tài khoản Google</div>
                <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>Cần đăng nhập để sử dụng tab Văn bản và tải file kế hoạch lên Drive</div>
              </div>
              <button
                onClick={() => login()}
                style={{ padding: "10px 22px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#4285F4,#2563eb)", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 2px 10px rgba(66,133,244,0.35)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Đăng nhập với Google
              </button>
            </div>
          )}
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
          {[
            { label: "Sao lưu dữ liệu (Export)", desc: "Tải xuống toàn bộ dữ liệu hiện tại về máy tính", btn: "Tải xuống bản sao lưu", v: "s" },
            { label: "Phục hồi dữ liệu (Import)", desc: "Khôi phục hệ thống từ file sao lưu trước đó", btn: "Chọn file sao lưu", v: "s" },
          ].map(item => (
            <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #f5f5f5" }}>
              <div>
                <div style={{ fontWeight: 700, color: "#1a1a2e", fontSize: 14 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{item.desc}</div>
              </div>
              <Btn v={item.v} onClick={() => alert("Tính năng đang được phát triển!")}>{item.btn}</Btn>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14 }}>
            <div>
              <div style={{ fontWeight: 700, color: "#c1121f", fontSize: 14 }}>Khôi phục cài đặt gốc</div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>Xóa trắng toàn bộ dữ liệu. Thao tác này không thể hoàn tác!</div>
            </div>
            <Btn v="d" onClick={() => window.confirm("Bạn có chắc chắn muốn xóa toàn bộ dữ liệu không?")}>Xóa dữ liệu</Btn>
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
