import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Avatar, Badge, Modal, FG, FI, FS, FT, Btn, SectionDivider } from './UI';
import { RED, TO_DOAN_LIST, DAN_TOC_LIST, TON_GIAO_LIST, TRINH_DO_VH_LIST, TRINH_DO_CM_LIST, TRINH_DO_LLCT_LIST, TIN_HOC_LIST, NGOAI_NGU_LIST, CHUC_VU_LIST, DOI_TUONG_LIST, REN_LUYEN_LIST, XEP_LOAI_LIST, HOI_LIST, EMPTY_FORM } from '../data/constants';

function MemberForm({ initial, onSave, onClose }) {
  const [f, setF] = useState(initial ? { ...initial } : { ...EMPTY_FORM });
  const upd = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  return (
    <Modal title={initial?.id ? "✏️ Chỉnh sửa đoàn viên" : "➕ Thêm đoàn viên mới"} onClose={onClose} wide>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 14px", maxHeight: "72vh", overflowY: "auto", paddingRight: 6 }}>
        <SectionDivider label="I. Thông tin cá nhân" />
        <FI label="Họ và tên *" value={f.hoTen} onChange={upd("hoTen")} placeholder="Nguyễn Văn A" />
        <FS label="Tổ đoàn *" opts={TO_DOAN_LIST} value={f.toDoan} onChange={upd("toDoan")} />
        <FS label="Giới tính" opts={["Nam", "Nữ"]} value={f.gioiTinh} onChange={upd("gioiTinh")} />
        <FI label="Ngày sinh" type="date" value={f.ngaySinh} onChange={upd("ngaySinh")} />
        <FI label="Tuổi" type="number" value={f.tuoi} onChange={upd("tuoi")} min={16} max={35} />
        <FS label="Dân tộc" opts={DAN_TOC_LIST} value={f.danToc} onChange={upd("danToc")} />
        <FS label="Tôn giáo" opts={TON_GIAO_LIST} value={f.tonGiao} onChange={upd("tonGiao")} />
        <FI label="Điện thoại" value={f.dienThoai} onChange={upd("dienThoai")} placeholder="09xxxxxxxx" />
        <FI label="Email" type="email" value={f.email} onChange={upd("email")} placeholder="abc@gmail.com" />
        <div style={{ gridColumn: "1/-1" }}><FT label="Quê quán" value={f.queQuan} onChange={upd("queQuan")} placeholder="Xã/phường, Huyện/quận, Tỉnh/thành" /></div>
        <div style={{ gridColumn: "1/-1" }}><FT label="Địa chỉ thường trú" value={f.diaChiThuongTru} onChange={upd("diaChiThuongTru")} placeholder="Xã/phường, Huyện/quận, Tỉnh/thành" /></div>

        <SectionDivider label="II. Giấy tờ tùy thân" />
        <FI label="Số CMND/CCCD" value={f.soCMND} onChange={upd("soCMND")} />
        <FI label="Ngày cấp" type="date" value={f.ngayCap} onChange={upd("ngayCap")} />
        <div style={{ gridColumn: "1/-1" }}><FI label="Nơi cấp" value={f.noiCap} onChange={upd("noiCap")} /></div>
        <FI label="Mã định danh đoàn viên" value={f.maDinhDanh} onChange={upd("maDinhDanh")} />
        <FI label="Số thẻ đoàn" value={f.soThe} onChange={upd("soThe")} />

        <SectionDivider label="III. Trình độ" />
        <FS label="Trình độ văn hóa" opts={TRINH_DO_VH_LIST} value={f.trinhDoVH} onChange={upd("trinhDoVH")} />
        <FS label="Trình độ chuyên môn" opts={TRINH_DO_CM_LIST} value={f.trinhDoCM} onChange={upd("trinhDoCM")} />
        <FS label="Trình độ lý luận chính trị" opts={TRINH_DO_LLCT_LIST} value={f.trinhDoLLCT} onChange={upd("trinhDoLLCT")} />
        <FS label="Tin học" opts={TIN_HOC_LIST} value={f.tinHoc} onChange={upd("tinHoc")} />
        <FS label="Ngoại ngữ" opts={NGOAI_NGU_LIST} value={f.ngoaiNgu} onChange={upd("ngoaiNgu")} />
        <FI label="Nghề nghiệp hiện nay" value={f.ngheNghiep} onChange={upd("ngheNghiep")} />

        <SectionDivider label="IV. Thông tin Đoàn - Đảng" />
        <FI label="Nơi vào Đoàn" value={f.noiVaoDoan} onChange={upd("noiVaoDoan")} placeholder="Tên trường/đơn vị" />
        <FI label="Thời gian vào Đoàn" type="date" value={f.tgVaoDoan} onChange={upd("tgVaoDoan")} />
        <FI label="Số NQ chuẩn y kết nạp" value={f.soNQ} onChange={upd("soNQ")} />
        <FI label="Thời gian vào Đảng" value={f.tgVaoDang} onChange={upd("tgVaoDang")} placeholder="dd/mm/yyyy hoặc năm" />

        <SectionDivider label="V. Phân loại & Đánh giá" />
        <FS label="Chức vụ trong chi đoàn" opts={CHUC_VU_LIST} value={f.chucVu} onChange={upd("chucVu")} />
        <FS label="Đối tượng đoàn viên" opts={DOI_TUONG_LIST} value={f.doiTuong} onChange={upd("doiTuong")} />
        <FS label="Rèn luyện đoàn viên" opts={REN_LUYEN_LIST} value={f.renLuyen} onChange={upd("renLuyen")} />
        <FS label="Đánh giá, xếp loại" opts={XEP_LOAI_LIST} value={f.xepLoai} onChange={upd("xepLoai")} />
        <FS label="Khen thưởng" opts={["Không", "Có"]} value={f.khenThuong} onChange={upd("khenThuong")} />
        <FS label="Kỷ luật" opts={["Không", "Có"]} value={f.kyLuat} onChange={upd("kyLuat")} />
        <FS label="Hội" opts={HOI_LIST} value={f.hoi} onChange={upd("hoi")} />
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14, paddingTop: 14, borderTop: "1px solid #eee" }}>
        <Btn v="s" onClick={onClose}>Hủy</Btn>
        <Btn onClick={() => { if (f.hoTen.trim()) onSave(f); }}>💾 Lưu đoàn viên</Btn>
      </div>
    </Modal>
  );
}

function MemberDetail({ m, onClose }) {
  const rows = [
    ["Tổ đoàn", m.toDoan], ["Giới tính", m.gioiTinh], ["Ngày sinh", m.ngaySinh], ["Tuổi", m.tuoi],
    ["Dân tộc", m.danToc], ["Tôn giáo", m.tonGiao], ["Điện thoại", m.dienThoai], ["Email", m.email],
    ["Quê quán", m.queQuan], ["Địa chỉ thường trú", m.diaChiThuongTru],
    ["Số CMND/CCCD", m.soCMND], ["Ngày cấp", m.ngayCap], ["Nơi cấp", m.noiCap],
    ["Mã định danh ĐV", m.maDinhDanh], ["Số thẻ đoàn", m.soThe],
    ["Trình độ VH", m.trinhDoVH], ["Trình độ CM", m.trinhDoCM], ["Trình độ LLCT", m.trinhDoLLCT],
    ["Tin học", m.tinHoc], ["Ngoại ngữ", m.ngoaiNgu], ["Nghề nghiệp", m.ngheNghiep],
    ["Nơi vào Đoàn", m.noiVaoDoan], ["Thời gian vào Đoàn", m.tgVaoDoan],
    ["Số NQ chuẩn y", m.soNQ], ["Thời gian vào Đảng", m.tgVaoDang],
    ["Chức vụ", m.chucVu], ["Đối tượng", m.doiTuong],
    ["Rèn luyện ĐV", m.renLuyen], ["Xếp loại", m.xepLoai],
    ["Khen thưởng", m.khenThuong], ["Kỷ luật", m.kyLuat], ["Hội", m.hoi],
  ];
  return (
    <Modal title="📋 Hồ sơ Đoàn viên" onClose={onClose} wide>
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 18, padding: 16, background: "#fff8f8", borderRadius: 12 }}>
        <Avatar name={m.hoTen} size={58} />
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: "#1a1a2e" }}>{m.hoTen}</div>
          <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Badge text={m.gioiTinh} /><Badge text={m.chucVu} /><Badge text={m.trinhDoCM} /><Badge text={m.trinhDoLLCT} />
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px", maxHeight: "55vh", overflowY: "auto" }}>
        {rows.map(([k, v]) => v ? (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f5f5f5", fontSize: 13, gap: 8 }}>
            <span style={{ color: "#999", flexShrink: 0, fontSize: 12 }}>{k}</span>
            <span style={{ fontWeight: 600, textAlign: "right", color: "#333", wordBreak: "break-word" }}>{v}</span>
          </div>
        ) : null)}
      </div>
    </Modal>
  );
}

export default function MemberManager({ members, setMembers }) {
  const [search, setSearch] = useState("");
  const [fTD, setFTD] = useState("Tất cả");
  const [fGT, setFGT] = useState("Tất cả");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [detail, setDetail] = useState(null);
  const fileInputRef = useRef(null);

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    return (!q || m.hoTen.toLowerCase().includes(q) || (m.dienThoai || "").includes(q) || (m.soCMND || "").includes(q))
      && (fTD === "Tất cả" || m.toDoan === fTD)
      && (fGT === "Tất cả" || m.gioiTinh === fGT);
  });

  const handleSave = (f) => {
    if (editItem) setMembers(prev => prev.map(m => m.id === editItem.id ? { ...f, id: editItem.id } : m));
    else setMembers(prev => [{ ...f, id: Date.now() }, ...prev]);
    setShowForm(false); setEditItem(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' });
      
      // Bỏ qua 3 dòng tiêu đề
      const rows = data.slice(3);
      const newMembers = rows.map((row, idx) => {
        // Cột 5 là Ngày sinh Nam, Cột 6 là Ngày sinh Nữ
        const gioiTinh = row[5] ? "Nam" : (row[6] ? "Nữ" : "Nam");
        const ngaySinh = (row[5] || row[6] || "").split(" ")[0]; // Lấy phần YYYY-MM-DD

        return {
          id: Date.now() + idx,
          hoTen: row[1] || "",
          toDoan: row[2] || "Phòng ban CS1",
          maDinhDanh: row[3] || "",
          soThe: row[4] || "",
          gioiTinh,
          ngaySinh,
          tuoi: row[7] || "",
          danToc: row[8] || "Kinh",
          tonGiao: row[9] || "Không",
          queQuan: (row[10] || "").replace(/\n/g, ", "),
          diaChiThuongTru: (row[11] || "").replace(/\n/g, ", "),
          soCMND: row[12] || "",
          ngayCap: (row[13] || "").split(" ")[0],
          noiCap: row[14] || "",
          trinhDoVH: row[15] || "Hệ 12/12",
          trinhDoCM: row[16] || "Chưa qua đào tạo",
          trinhDoLLCT: row[17] || "Chưa có",
          tinHoc: row[18] || "Chưa có",
          ngoaiNgu: row[19] || "Chưa có",
          noiVaoDoan: row[20] || "",
          tgVaoDoan: (row[21] || "").split(" ")[0],
          soNQ: row[22] || "",
          tgVaoDang: (row[23] || "").split(" ")[0],
          ngheNghiep: row[24] || "Cán bộ/Công chức/Viên chức",
          doiTuong: row[25] || "Sinh hoạt chính",
          renLuyen: row[26] || "Đã đăng ký",
          xepLoai: row[27] || "Chưa đánh giá",
          khenThuong: row[28] || "Không",
          kyLuat: row[29] || "Không",
          chucVu: row[30] || "Đoàn viên",
          hoi: row[31] || "Hội LHTN Việt Nam",
          email: row[32] || "",
          dienThoai: row[33] || ""
        };
      }).filter(m => m.hoTen); // Lọc bỏ dòng trống

      if (newMembers.length > 0) {
        setMembers(newMembers);
        alert(`Đã nhập thành công ${newMembers.length} đoàn viên từ Excel!`);
      } else {
        alert('Không tìm thấy dữ liệu hợp lệ trong file Excel.');
      }
    };
    reader.readAsBinaryString(file);
    // Reset input
    e.target.value = null;
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 22, color: "#1a1a2e" }}>👥 Quản lý Đoàn viên <span style={{ fontSize: 13, color: "#aaa", fontWeight: 400 }}>({filtered.length}/{members.length})</span></h2>
        <div style={{ display: "flex", gap: 8 }}>
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            style={{ display: 'none' }} 
          />
          <Btn v="s" onClick={() => fileInputRef.current?.click()}>📥 Nhập từ Excel</Btn>
          <Btn onClick={() => { setEditItem(null); setShowForm(true); }}>+ Thêm đoàn viên</Btn>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Tìm theo tên, SĐT, số CMND/CCCD..." style={{ flex: 1, minWidth: 200, padding: "9px 14px", border: "1.5px solid #e0e0e0", borderRadius: 10, fontSize: 13, outline: "none" }} />
        <select value={fTD} onChange={e => setFTD(e.target.value)} style={{ padding: "9px 12px", border: "1.5px solid #e0e0e0", borderRadius: 10, fontSize: 13 }}>
          <option>Tất cả</option>{TO_DOAN_LIST.map(t => <option key={t}>{t}</option>)}
        </select>
        {["Tất cả", "Nam", "Nữ"].map(g => <button key={g} onClick={() => setFGT(g)} style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: fGT === g ? RED : "#f0f0f0", color: fGT === g ? "#fff" : "#555", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>{g}</button>)}
      </div>
      <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#fafafa", borderBottom: "2px solid #f0f0f0" }}>
                {["#", "Họ và tên", "GT", "Tuổi", "Tổ đoàn", "Chức vụ", "Tr.độ CM", "LLCT", "Điện thoại", ""].map(h => (
                  <th key={h} style={{ padding: "11px 13px", textAlign: "left", fontWeight: 700, color: "#666", whiteSpace: "nowrap", fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={m.id} style={{ borderBottom: "1px solid #f5f5f5", transition: "background .1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#fff8f8"}
                  onMouseLeave={e => e.currentTarget.style.background = ""}>
                  <td style={{ padding: "9px 13px", color: "#bbb", fontSize: 12 }}>{i + 1}</td>
                  <td style={{ padding: "9px 13px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <Avatar name={m.hoTen} size={30} />
                      <span style={{ fontWeight: 600, color: "#1a1a2e" }}>{m.hoTen}</span>
                    </div>
                  </td>
                  <td style={{ padding: "9px 13px" }}><Badge text={m.gioiTinh} /></td>
                  <td style={{ padding: "9px 13px", color: "#666" }}>{m.tuoi}</td>
                  <td style={{ padding: "9px 13px", color: "#555", whiteSpace: "nowrap", fontSize: 12 }}>{m.toDoan}</td>
                  <td style={{ padding: "9px 13px" }}><Badge text={m.chucVu} /></td>
                  <td style={{ padding: "9px 13px" }}><Badge text={m.trinhDoCM} /></td>
                  <td style={{ padding: "9px 13px" }}><Badge text={m.trinhDoLLCT} /></td>
                  <td style={{ padding: "9px 13px", color: "#888", fontSize: 12 }}>{m.dienThoai}</td>
                  <td style={{ padding: "9px 13px" }}>
                    <div style={{ display: "flex", gap: 5 }}>
                      <button onClick={() => setDetail(m)} style={{ padding: "4px 9px", borderRadius: 6, border: "none", background: "#f0f0f0", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Xem</button>
                      <button onClick={() => { setEditItem(m); setShowForm(true); }} style={{ padding: "4px 9px", borderRadius: 6, border: "none", background: "#fff3e0", color: "#e65100", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Sửa</button>
                      <button onClick={() => { if (window.confirm("Xóa đoàn viên này?")) setMembers(p => p.filter(x => x.id !== m.id)); }} style={{ padding: "4px 9px", borderRadius: 6, border: "none", background: "#ffeef0", color: RED, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <div style={{ textAlign: "center", padding: 40, color: "#ccc" }}>Không tìm thấy đoàn viên</div>}
        </div>
      </div>
      {showForm && <MemberForm initial={editItem} onSave={handleSave} onClose={() => { setShowForm(false); setEditItem(null); }} />}
      {detail && <MemberDetail m={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
