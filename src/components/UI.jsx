import React from 'react';
import { createPortal } from 'react-dom';
import { RED, GOLD, GREEN, NAVY } from '../data/constants';

export function Avatar({ name, size = 40 }) {
  const initials = name.split(" ").map(w => w[0]).slice(-2).join("").toUpperCase();
  const cols = [RED, GOLD, GREEN, NAVY, "#9b5de5", "#f15bb5"];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: cols[name.charCodeAt(0) % cols.length], display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: size * 0.33, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export function Badge({ text }) {
  const map = { "Nam": NAVY, "Nữ": "#e76f51", "Cao đẳng": GREEN, "Đại học": GREEN, "Sau đại học": NAVY, "Trung cấp": GOLD, "Sơ cấp": GOLD, "Chưa có": "#aaa", "Bí thư chi đoàn": RED, "Phó bí thư chi đoàn": GOLD, "Phó bí thư Đoàn cơ sở": RED, "Bí thư Đoàn cơ sở": RED, "Ủy viên Ban chấp hành chi đoàn": GREEN, "Đoàn viên": "#888", "Cao cấp": "#9b5de5", "Đã đăng ký": GREEN, "Chưa đăng ký": "#aaa" };
  return (
    <span style={{ padding: "2px 9px", borderRadius: 20, background: map[text] || "#999", color: "#fff", fontSize: 11, fontWeight: 700, display: "inline-block", whiteSpace: "nowrap" }}>
      {text}
    </span>
  );
}

export function Modal({ title, onClose, children, wide }) {
  const modalContent = (
    <div className="modal-overlay" style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, overflowY: "auto" }}>
      <div className="modal-content" style={{ background: "#fff", borderRadius: 16, padding: 26, width: "100%", maxWidth: wide ? 800 : 540, margin: "20px auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ margin: 0, color: "#1a1a2e", fontSize: 17 }}>{title}</h3>
          <button onClick={onClose} style={{ border: "none", background: "#f0f0f0", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 18 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
  return createPortal(modalContent, document.body);
}

export function FG({ label, children }) {
  return (
    <div style={{ marginBottom: 11 }}>
      <label style={{ display: "block", marginBottom: 4, fontSize: 11, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</label>
      {children}
    </div>
  );
}

export const inputStyle = { width: "100%", padding: "8px 11px", border: "1.5px solid #e0e0e0", borderRadius: 7, fontSize: 13, boxSizing: "border-box", outline: "none", fontFamily: "inherit" };

export function FI({ label, ...p }) { return <FG label={label}><input className="input-premium" style={inputStyle} {...p} /></FG>; }
export function FS({ label, opts, ...p }) { return <FG label={label}><select className="input-premium" style={inputStyle} {...p}>{opts.map(o => <option key={o}>{o}</option>)}</select></FG>; }
export function FT({ label, ...p }) { return <FG label={label}><textarea rows={2} className="input-premium" style={{ ...inputStyle, resize: "vertical" }} {...p} /></FG>; }

export function Btn({ children, v = "p", ...p }) {
  const s = { p: { background: `linear-gradient(135deg,${RED},#c1121f)`, color: "#fff" }, s: { background: "#f0f0f0", color: "#333" }, d: { background: "#ffeef0", color: RED } };
  return <button className="btn-premium" style={{ padding: "8px 16px", borderRadius: 8, border: "none", fontWeight: 700, cursor: "pointer", fontSize: 13, ...s[v], ...p.style }} {...p}>{children}</button>;
}

export const SectionDivider = ({ label }) => (
  <div style={{ gridColumn: "1/-1", fontWeight: 800, fontSize: 11, color: RED, textTransform: "uppercase", letterSpacing: 1, borderBottom: `2px solid ${RED}22`, paddingBottom: 4, marginTop: 10, marginBottom: 2 }}>{label}</div>
);

export function Th({ children, className = "" }) {
  return <th className={`p-4 text-sm font-bold text-gray-600 border-b border-gray-100 ${className}`}>{children}</th>;
}

export function Td({ children, className = "" }) {
  return <td className={`p-4 text-sm text-gray-800 ${className}`}>{children}</td>;
}
