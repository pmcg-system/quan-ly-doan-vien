import React, { useMemo } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { RED, GOLD, GREEN, NAVY, TEAL, CHART_COLORS, TRINH_DO_CM_LIST, TRINH_DO_LLCT_LIST, ageGroup, TRANG_THAI_DV } from '../data/constants';

export default function Dashboard({ members }) {
  const activeMembers = useMemo(() => {
    return members.filter(m => !m.trangThai || m.trangThai === TRANG_THAI_DV.ACTIVE || m.trangThai === TRANG_THAI_DV.CHUYEN_DEN);
  }, [members]);

  const total = activeMembers.length;
  const nam = activeMembers.filter(m => m.gioiTinh === "Nam").length;
  const nu = total - nam;

  const genderData = [{ name: "Nam", value: nam }, { name: "Nữ", value: nu }];

  const dangVien = activeMembers.filter(m => m.tgVaoDang && m.tgVaoDang.trim() !== "").length;
  const chuaVaoDang = total - dangVien;
  const dangVienData = [{ name: "Đảng viên", value: dangVien }, { name: "Đoàn viên", value: chuaVaoDang }];

  const toDoanData = useMemo(() => {
    const map = {};
    activeMembers.forEach(m => { map[m.toDoan] = (map[m.toDoan] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [activeMembers]);

  const ageData = useMemo(() => {
    const groups = { "≤25": 0, "26-28": 0, "29-30": 0, ">30": 0 };
    activeMembers.forEach(m => { groups[ageGroup(m.tuoi)]++; });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [activeMembers]);

  const cmData = useMemo(() => {
    const map = {};
    TRINH_DO_CM_LIST.forEach(k => { map[k] = 0; });
    activeMembers.forEach(m => { if (map[m.trinhDoCM] !== undefined) map[m.trinhDoCM]++; });
    return Object.entries(map).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [activeMembers]);

  const llctData = useMemo(() => {
    const map = {};
    TRINH_DO_LLCT_LIST.forEach(k => { map[k] = 0; });
    activeMembers.forEach(m => { if (map[m.trinhDoLLCT] !== undefined) map[m.trinhDoLLCT]++; });
    return Object.entries(map).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [activeMembers]);

  const CC = ({ title, children }) => (
    <div className="card-hover" style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a2e", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 3, height: 16, background: RED, borderRadius: 2, display: "inline-block" }} />{title}
      </div>
      {children}
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, color: "#1a1a2e" }}>📊 Tổng quan Đoàn viên</h2>
        <p style={{ margin: "4px 0 0", color: "#888", fontSize: 13 }}>Thống kê tự động theo dữ liệu đoàn viên hiện có</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 14, marginBottom: 22 }}>
        {[
          ["👥", "Tổng ĐV", total, RED], 
          ["👨", "Nam", nam, NAVY], 
          ["👩", "Nữ", nu, "#e76f51"], 
          ["⭐", "Đảng viên", dangVien, "#d4af37"],
          ["🏢", "Tổ đoàn", toDoanData.length, GREEN]
        ].map(([icon, label, value, color]) => (
          <div key={label} className="card-hover" style={{ background: "#fff", borderRadius: 13, padding: "16px 18px", boxShadow: "0 2px 10px rgba(0,0,0,0.07)", borderLeft: `4px solid ${color}` }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 12, color: "#999", fontWeight: 600, marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        <CC title="Theo giới tính">
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={genderData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`} labelLine>
                <Cell fill={NAVY} /><Cell fill="#e76f51" />
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </CC>
        <CC title="Tỷ lệ Đảng viên">
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={dangVienData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`} labelLine>
                <Cell fill="#d4af37" /><Cell fill={RED} />
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </CC>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        <CC title="Theo nhóm tuổi (≤25 / 26-28 / 29-30 / >30)">
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={ageData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip formatter={v => [v, "Đoàn viên"]} />
              <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                {ageData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CC>
        <CC title="Theo trình độ lý luận chính trị">
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={llctData} cx="50%" cy="50%" outerRadius={72} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {llctData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
              </Pie>
              <Tooltip /><Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </CC>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        <CC title="Theo tổ đoàn">
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={toDoanData} layout="vertical" margin={{ top: 0, right: 20, left: 100, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
              <Tooltip formatter={v => [v, "Đoàn viên"]} />
              <Bar dataKey="value" radius={[0, 5, 5, 0]}>
                {toDoanData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CC>
        <CC title="Theo trình độ chuyên môn">
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={cmData} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip formatter={v => [v, "Đoàn viên"]} />
              <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                {cmData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CC>
      </div>

      <div style={{ marginTop: 18, background: `linear-gradient(135deg,#c1121f,${RED})`, borderRadius: 14, padding: "18px 22px", color: "#fff" }}>
        <div style={{ fontWeight: 800, fontSize: 15 }}>🌟 Đoàn TNCS Hồ Chí Minh</div>
        <div style={{ fontSize: 13, opacity: 0.9, marginTop: 6 }}>"Tuổi trẻ Việt Nam tiên phong, bản lĩnh, đoàn kết, sáng tạo, phát triển"</div>
      </div>
    </div>
  );
}
