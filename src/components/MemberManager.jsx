import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Avatar, Badge, Modal, FG, FI, FS, FT, Btn, SectionDivider, inputStyle } from './UI';
import { RED, TO_DOAN_LIST, DAN_TOC_LIST, TON_GIAO_LIST, TRINH_DO_VH_LIST, TRINH_DO_CM_LIST, TRINH_DO_LLCT_LIST, TIN_HOC_LIST, NGOAI_NGU_LIST, CHUC_VU_LIST, DOI_TUONG_LIST, REN_LUYEN_LIST, XEP_LOAI_LIST, HOI_LIST, EMPTY_FORM, TRANG_THAI_DV, getBranchConfig } from '../data/constants';

const STATUS_LABEL = { chuyen_di: 'Chuyển đi', chuyen_den: 'Chuyển đến', truong_thanh: 'Trưởng thành Đoàn', xoa_ten: 'Xóa tên', active: 'Đang sinh hoạt' };
const STATUS_COLOR = { chuyen_di: '#f97316', truong_thanh: '#8b5cf6', xoa_ten: '#e63946', chuyen_den: '#16a34a', active: '#2a9d8f' };

function CustomSelect({ label, opts, value, onChange, placeholder = "Tự nhập mục khác..." }) {
  const isCustom = value !== undefined && value !== null && value !== "" && !opts.includes(value);
  const selectValue = isCustom ? "Khác..." : value;

  const handleSelectChange = (e) => {
    const val = e.target.value;
    if (val === "Khác...") {
      onChange({ target: { value: " " } }); // Sử dụng một khoảng trắng tạm thời để kích hoạt input tự nhập
    } else {
      onChange({ target: { value: val } });
    }
  };

  return (
    <FG label={label}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <select
          style={inputStyle}
          value={selectValue}
          onChange={handleSelectChange}
        >
          {opts.map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
          <option value="Khác...">📝 Tự nhập mục khác...</option>
        </select>
        {(isCustom || selectValue === "Khác...") ? (
          <input
            type="text"
            style={inputStyle}
            value={value === " " ? "" : value}
            onChange={onChange}
            placeholder={placeholder}
            autoFocus
          />
        ) : null}
      </div>
    </FG>
  );
}

function MemberForm({ initial, onSave, onClose }) {
  const [f, setF] = useState(initial ? { ...initial } : { ...EMPTY_FORM });
  const upd = k => e => setF(p => ({ ...p, [k]: e.target.value }));

  const handleNgaySinhChange = (e) => {
    const val = e.target.value;
    setF(p => {
      let nextTuoi = p.tuoi;
      if (val) {
        const birthYear = new Date(val).getFullYear();
        if (!isNaN(birthYear)) {
          nextTuoi = new Date().getFullYear() - birthYear;
        }
      }
      return { ...p, ngaySinh: val, tuoi: nextTuoi };
    });
  };

  const handleTuoiChange = (e) => {
    const val = e.target.value;
    setF(p => {
      let nextNgaySinh = p.ngaySinh;
      if (val) {
        const ageNum = parseInt(val, 10);
        if (!isNaN(ageNum)) {
          const currentYear = new Date().getFullYear();
          const birthYear = currentYear - ageNum;
          if (p.ngaySinh && p.ngaySinh.length >= 10) {
            const parts = p.ngaySinh.split('-');
            nextNgaySinh = `${birthYear}-${parts[1]}-${parts[2]}`;
          } else {
            nextNgaySinh = `${birthYear}-01-01`;
          }
        }
      }
      return { ...p, tuoi: val, ngaySinh: nextNgaySinh };
    });
  };

  return (
    <Modal title={initial?.id ? "✏️ Chỉnh sửa đoàn viên" : "➕ Thêm đoàn viên mới"} onClose={onClose} wide>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 14px", maxHeight: "72vh", overflowY: "auto", paddingRight: 6 }}>
        <SectionDivider label="I. Thông tin cá nhân" />
        <FI label="Họ và tên *" value={f.hoTen} onChange={upd("hoTen")} placeholder="Nguyễn Văn A" />
        <CustomSelect label="Tổ đoàn *" opts={TO_DOAN_LIST} value={f.toDoan} onChange={upd("toDoan")} placeholder="Nhập tên tổ đoàn/phòng ban..." />
        <FS label="Giới tính" opts={["Nam", "Nữ"]} value={f.gioiTinh} onChange={upd("gioiTinh")} />
        <FI label="Ngày sinh" type="date" value={f.ngaySinh} onChange={handleNgaySinhChange} />
        <FI label="Tuổi" type="number" value={f.tuoi} onChange={handleTuoiChange} min={16} max={35} />
        <CustomSelect label="Dân tộc" opts={DAN_TOC_LIST} value={f.danToc} onChange={upd("danToc")} />
        <CustomSelect label="Tôn giáo" opts={TON_GIAO_LIST} value={f.tonGiao} onChange={upd("tonGiao")} />
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
        <CustomSelect label="Trình độ văn hóa" opts={TRINH_DO_VH_LIST} value={f.trinhDoVH} onChange={upd("trinhDoVH")} />
        <CustomSelect label="Trình độ chuyên môn" opts={TRINH_DO_CM_LIST} value={f.trinhDoCM} onChange={upd("trinhDoCM")} />
        <CustomSelect label="Trình độ lý luận chính trị" opts={TRINH_DO_LLCT_LIST} value={f.trinhDoLLCT} onChange={upd("trinhDoLLCT")} />
        <CustomSelect label="Tin học" opts={TIN_HOC_LIST} value={f.tinHoc} onChange={upd("tinHoc")} />
        <CustomSelect label="Ngoại ngữ" opts={NGOAI_NGU_LIST} value={f.ngoaiNgu} onChange={upd("ngoaiNgu")} />
        <FI label="Nghề nghiệp hiện nay" value={f.ngheNghiep} onChange={upd("ngheNghiep")} />

        <SectionDivider label="IV. Thông tin Đoàn - Đảng" />
        <FI label="Nơi vào Đoàn" value={f.noiVaoDoan} onChange={upd("noiVaoDoan")} placeholder="Tên trường/đơn vị" />
        <FI label="Thời gian vào Đoàn" type="date" value={f.tgVaoDoan} onChange={upd("tgVaoDoan")} />
        <FI label="Số NQ chuẩn y kết nạp" value={f.soNQ} onChange={upd("soNQ")} />
        <FI label="Thời gian vào Đảng" value={f.tgVaoDang} onChange={upd("tgVaoDang")} placeholder="dd/mm/yyyy hoặc năm" />

        <SectionDivider label="V. Phân loại & Đánh giá" />
        <CustomSelect label="Chức vụ trong chi đoàn" opts={CHUC_VU_LIST} value={f.chucVu} onChange={upd("chucVu")} />
        <CustomSelect label="Đối tượng đoàn viên" opts={DOI_TUONG_LIST} value={f.doiTuong} onChange={upd("doiTuong")} />
        <CustomSelect label="Rèn luyện đoàn viên" opts={REN_LUYEN_LIST} value={f.renLuyen} onChange={upd("renLuyen")} />
        <CustomSelect label="Đánh giá, xếp loại" opts={XEP_LOAI_LIST} value={f.xepLoai} onChange={upd("xepLoai")} />
        <FS label="Khen thưởng" opts={["Không", "Có"]} value={f.khenThuong} onChange={upd("khenThuong")} />
        <FS label="Kỷ luật" opts={["Không", "Có"]} value={f.kyLuat} onChange={upd("kyLuat")} />
        <CustomSelect label="Hội" opts={HOI_LIST} value={f.hoi} onChange={upd("hoi")} />
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

export default function MemberManager({ members, setMembers, isAdmin }) {
  const [search, setSearch] = useState("");
  const [fTD, setFTD] = useState("Tất cả");
  const [fGT, setFGT] = useState("Tất cả");
  const [fStatus, setFStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [detail, setDetail] = useState(null);
  const [statusModal, setStatusModal] = useState(null); // member đang đổi trạng thái
  const [noiDenInput, setNoiDenInput] = useState('');
  const [ngayBienDong, setNgayBienDong] = useState(() => new Date().toISOString().split('T')[0]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const fileInputRef = useRef(null);

  const handleExportTemplate = () => {
    const wsData = [
      ["DANH SÁCH ĐOÀN VIÊN MẪU"],
      ["Hệ thống Quản lý Đoàn viên Chi đoàn"],
      [
        "STT", "Họ và tên", "Tổ đoàn", "Mã định danh", "Số thẻ đoàn",
        "Ngày sinh Nam", "Ngày sinh Nữ", "Tuổi", "Dân tộc", "Tôn giáo",
        "Quê quán", "Địa chỉ thường trú", "Số CMND/CCCD", "Ngày cấp", "Nơi cấp",
        "Trình độ văn hóa", "Trình độ chuyên môn", "Trình độ lý luận chính trị", "Tin học", "Ngoại ngữ",
        "Nơi vào Đoàn", "Thời gian vào Đoàn", "Số NQ chuẩn y", "Thời gian vào Đảng", "Nghề nghiệp hiện nay",
        "Đối tượng đoàn viên", "Rèn luyện đoàn viên", "Đánh giá xếp loại", "Khen thưởng", "Kỷ luật",
        "Chức vụ trong chi đoàn", "Hội", "Email", "Điện thoại"
      ],
      [
        "1", "Nguyễn Văn A", "Phòng ban+Dược", "1234567", "0123456789",
        "1998-03-26", "", "28", "Kinh", "Không",
        "Thị xã Đông Triều, Quảng Ninh", "Thị xã Đông Triều, Quảng Ninh", "033098001234", "2015-05-10", "Cục Cảnh sát QLHC về TTXH",
        "Hệ 12/12", "Đại học", "Chưa có", "Chuẩn kỹ năng sử dụng CNTT cơ bản", "Bậc 2",
        "THPT Đông Triều", "2013-03-26", "NQ-01", "", "Cán bộ",
        "Sinh hoạt chính", "Đã đăng ký", "Chưa đánh giá", "Không", "Không",
        "Đoàn viên", "Hội LHTN Việt Nam", "nguyenvana@gmail.com", "0987654321"
      ]
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Mau_Danh_Sach");
    XLSX.writeFile(wb, "mau_danh_sach_doan_vien.xlsx");
  };

  const isInactive = m => m.trangThai && m.trangThai !== TRANG_THAI_DV.ACTIVE && m.trangThai !== TRANG_THAI_DV.CHUYEN_DEN;

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortFn = (a, b) => {
    if (!sortConfig.key) return 0;
    let aVal = a[sortConfig.key] || "";
    let bVal = b[sortConfig.key] || "";
    if (sortConfig.key === 'tuoi') {
      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
    } else {
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    }
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  };

  const baseFiltered = members.filter(m => {
    const q = search.toLowerCase();
    const matchText = !q || m.hoTen.toLowerCase().includes(q) || (m.dienThoai||"").includes(q) || (m.soCMND||"").includes(q);
    const matchTD = fTD === "Tất cả" || m.toDoan === fTD;
    const matchGT = fGT === "Tất cả" || m.gioiTinh === fGT;
    const matchStatus = fStatus === 'all' || (fStatus === 'active' ? !isInactive(m) : m.trangThai === fStatus);
    return matchText && matchTD && matchGT && matchStatus;
  });

  const filtered = [
    ...baseFiltered.filter(m => !isInactive(m)).sort(sortFn),
    ...baseFiltered.filter(m => isInactive(m)).sort(sortFn),
  ];

  const handleSave = (f) => {
    if (editItem) setMembers(prev => prev.map(m => m.id === editItem.id ? { ...f, id: editItem.id } : m));
    else setMembers(prev => [{ ...f, id: Date.now(), trangThai: TRANG_THAI_DV.ACTIVE }, ...prev]);
    setShowForm(false); setEditItem(null);
  };

  const handleChangeStatus = (newStatus) => {
    if (!statusModal) return;
    setMembers(prev => prev.map(m => m.id === statusModal.id ? {
      ...m,
      trangThai: newStatus,
      noiDen: newStatus === TRANG_THAI_DV.CHUYEN_DI ? noiDenInput : m.noiDen,
      ngayBienDong,
    } : m));
    setStatusModal(null);
    setNoiDenInput('');
  };

  const handleDelete = (m) => {
    if (window.confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN đoàn viên "${m.hoTen}" không?\nThao tác này sẽ xóa hoàn toàn dữ liệu và không thể hoàn tác!`)) {
      setMembers(prev => prev.filter(item => item.id !== m.id));
    }
  };

  const handleExportData = () => {
    let branchName = "";
    try {
      const savedUser = localStorage.getItem('app_current_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        const config = getBranchConfig(u.username);
        branchName = config.displayName || "";
      }
    } catch(e) {}

    const wsData = [
      ["DANH SÁCH ĐOÀN VIÊN"],
      [branchName ? `Đơn vị: ${branchName}` : ""],
      [
        "STT", "Họ và tên", "Giới tính", "Tổ đoàn", "Mã định danh", "Số thẻ đoàn",
        "Ngày sinh", "Tuổi", "Dân tộc", "Tôn giáo",
        "Quê quán", "Địa chỉ thường trú", "Số CMND/CCCD", "Ngày cấp", "Nơi cấp",
        "Trình độ văn hóa", "Trình độ chuyên môn", "Trình độ lý luận chính trị", "Tin học", "Ngoại ngữ",
        "Nơi vào Đoàn", "Thời gian vào Đoàn", "Số NQ chuẩn y", "Thời gian vào Đảng", "Nghề nghiệp hiện nay",
        "Đối tượng đoàn viên", "Rèn luyện đoàn viên", "Đánh giá xếp loại", "Khen thưởng", "Kỷ luật",
        "Chức vụ trong chi đoàn", "Hội", "Email", "Điện thoại", "Trạng thái"
      ]
    ];

    filtered.forEach((m, idx) => {
      wsData.push([
        idx + 1,
        m.hoTen || "",
        m.gioiTinh || "",
        m.toDoan || "",
        m.maDinhDanh || "",
        m.soThe || "",
        m.ngaySinh || "",
        m.tuoi || "",
        m.danToc || "",
        m.tonGiao || "",
        m.queQuan || "",
        m.diaChiThuongTru || "",
        m.soCMND || "",
        m.ngayCap || "",
        m.noiCap || "",
        m.trinhDoVH || "",
        m.trinhDoCM || "",
        m.trinhDoLLCT || "",
        m.tinHoc || "",
        m.ngoaiNgu || "",
        m.noiVaoDoan || "",
        m.tgVaoDoan || "",
        m.soNQ || "",
        m.tgVaoDang || "",
        m.ngheNghiep || "",
        m.doiTuong || "",
        m.renLuyen || "",
        m.xepLoai || "",
        m.khenThuong || "",
        m.kyLuat || "",
        m.chucVu || "",
        m.hoi || "",
        m.email || "",
        m.dienThoai || "",
        STATUS_LABEL[m.trangThai] || "Đang sinh hoạt"
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Danh_Sach");
    XLSX.writeFile(wb, "danh_sach_doan_vien.xlsx");
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

  const activeCount = members.filter(m => !isInactive(m)).length;
  const inactiveCount = members.filter(m => isInactive(m)).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, color: "#1a1a2e" }}>👥 Quản lý Đoàn viên <span style={{ fontSize: 13, color: "#aaa", fontWeight: 400 }}>({filtered.length}/{members.length})</span></h2>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 20, background: '#e8f5e9', color: '#2e7d32', fontWeight: 700 }}>Đang SH: {activeCount}</span>
            <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 20, background: '#f5f5f5', color: '#888', fontWeight: 700 }}>Biến động: {inactiveCount}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {isAdmin && (
            <>
              <input type="file" accept=".xlsx,.xls" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
              <Btn v="s" onClick={handleExportTemplate}>📄 Tải file mẫu</Btn>
              <Btn v="s" onClick={() => fileInputRef.current?.click()}>📥 Nhập từ Excel</Btn>
              <Btn v="s" onClick={handleExportData}>📤 Xuất file Excel</Btn>
              <Btn onClick={() => { setEditItem(null); setShowForm(true); }}>+ Thêm đoàn viên</Btn>
            </>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Tìm theo tên, SĐT, số CMND/CCCD..." style={{ flex: 1, minWidth: 200, padding: "9px 14px", border: "1.5px solid #e0e0e0", borderRadius: 10, fontSize: 13, outline: "none" }} />
        <select value={fTD} onChange={e => setFTD(e.target.value)} style={{ padding: "9px 12px", border: "1.5px solid #e0e0e0", borderRadius: 10, fontSize: 13 }}>
          <option>Tất cả</option>{TO_DOAN_LIST.map(t => <option key={t}>{t}</option>)}
        </select>
        {["Tất cả", "Nam", "Nữ"].map(g => <button key={g} onClick={() => setFGT(g)} style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: fGT === g ? RED : "#f0f0f0", color: fGT === g ? "#fff" : "#555", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>{g}</button>)}
        <select value={fStatus} onChange={e => setFStatus(e.target.value)} style={{ padding: "9px 12px", border: "1.5px solid #e0e0e0", borderRadius: 10, fontSize: 13 }}>
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang sinh hoạt</option>
          <option value="chuyen_den">Chuyển đến</option>
          <option value="chuyen_di">Chuyển đi</option>
          <option value="truong_thanh">Trưởng thành Đoàn</option>
          <option value="xoa_ten">Xóa tên</option>
        </select>
      </div>
      <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
        <div style={{ overflowX: "auto", maxHeight: "calc(100vh - 180px)", overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#fafafa", borderBottom: "2px solid #f0f0f0" }}>
                {["#", "Họ và tên", "Tuổi", "Tổ đoàn", "Chức vụ", "Tr.độ CM", "Điện thoại", ""].map(h => {
                  const colKeys = { "Họ và tên": "hoTen", "Tuổi": "tuoi", "Tổ đoàn": "toDoan", "Chức vụ": "chucVu", "Tr.độ CM": "trinhDoCM", "Điện thoại": "dienThoai" };
                  const isSortable = !!colKeys[h];
                  const isActiveSort = sortConfig.key === colKeys[h];
                  const widthMap = {
                    "#": "50px",
                    "Họ và tên": "180px",
                    "Tuổi": "70px",
                    "Tổ đoàn": "140px",
                    "Chức vụ": "140px",
                    "Tr.độ CM": "150px",
                    "Điện thoại": "120px",
                    "": "180px"
                  };
                  return (
                    <th key={h} 
                        onClick={() => isSortable && handleSort(colKeys[h])}
                        style={{ width: widthMap[h] || "auto", padding: "11px 13px", textAlign: "left", fontWeight: 700, color: "#666", whiteSpace: "nowrap", fontSize: 12, position: "sticky", top: 0, background: "#fafafa", zIndex: 2, boxShadow: "0 1px 0 #e0e0e0", cursor: isSortable ? "pointer" : "default", userSelect: "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {h}
                        {isSortable && (
                           <span style={{ color: isActiveSort ? RED : "#ccc", fontSize: 10 }}>
                             {isActiveSort ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
                           </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => {
                const inactive = isInactive(m);
                const st = m.trangThai;
                return (
                  <tr key={m.id} style={{ borderBottom: "1px solid #f5f5f5", opacity: inactive ? 0.45 : 1, transition: "background .1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = inactive ? "#f5f5f5" : "#fff8f8"}
                    onMouseLeave={e => e.currentTarget.style.background = ""}
                  >
                    <td style={{ padding: "9px 13px", color: "#bbb", fontSize: 12, width: "50px" }}>{i + 1}</td>
                    <td style={{ padding: "9px 13px", whiteSpace: "nowrap", width: "180px", maxWidth: "180px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9, overflow: "hidden" }}>
                        <Avatar name={m.hoTen} size={30} />
                        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                          <span onClick={() => setDetail(m)} title={m.hoTen} style={{ fontWeight: 600, color: inactive ? "#999" : "#1a1a2e", cursor: 'pointer', textDecoration: 'underline dotted', textDecorationColor: '#ccc', whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{m.hoTen}</span>
                          {st && st !== TRANG_THAI_DV.ACTIVE && (
                            <div style={{ fontSize: 10, color: STATUS_COLOR[st] || '#aaa', fontWeight: 700, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                              {STATUS_LABEL[st]}{st === TRANG_THAI_DV.CHUYEN_DI && m.noiDen ? ` → ${m.noiDen}` : ''}{m.ngayBienDong ? ` (${new Date(m.ngayBienDong).toLocaleDateString('vi-VN')})` : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "9px 13px", color: "#666", width: "70px" }}>{m.tuoi}</td>
                    <td style={{ padding: "9px 13px", color: "#555", whiteSpace: "nowrap", fontSize: 12, width: "140px" }}>{m.toDoan}</td>
                    <td style={{ padding: "9px 13px", width: "140px" }}><Badge text={m.chucVu} /></td>
                    <td style={{ padding: "9px 13px", width: "150px" }}><Badge text={m.trinhDoCM} /></td>
                    <td style={{ padding: "9px 13px", color: "#888", fontSize: 12, whiteSpace: "nowrap", width: "120px" }}>{m.dienThoai}</td>
                    <td style={{ padding: "9px 13px" }}>
                      <div style={{ display: "flex", gap: 5 }}>
                        {isAdmin && (
                          <>
                            <button onClick={() => { setEditItem(m); setShowForm(true); }} style={{ padding: "4px 9px", borderRadius: 6, border: "none", background: "#fff3e0", color: "#e65100", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Sửa</button>
                            <button onClick={() => { setStatusModal(m); setNoiDenInput(m.noiDen||''); setNgayBienDong(new Date().toISOString().split('T')[0]); }} style={{ padding: "4px 9px", borderRadius: 6, border: "none", background: '#eef2ff', color: '#4f46e5', cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Biến động</button>
                            <button onClick={() => handleDelete(m)} style={{ padding: "4px 9px", borderRadius: 6, border: "none", background: "#ffeef0", color: "#c8102e", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Xóa</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!filtered.length && <div style={{ textAlign: "center", padding: 40, color: "#ccc" }}>Không tìm thấy đoàn viên</div>}
        </div>
      </div>
      {showForm && <MemberForm initial={editItem} onSave={handleSave} onClose={() => { setShowForm(false); setEditItem(null); }} />}
      {detail && <MemberDetail m={detail} onClose={() => setDetail(null)} />}
      {statusModal && (
        <Modal title={`🔄 Biến động đoàn viên: ${statusModal.hoTen}`} onClose={() => setStatusModal(null)}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', marginBottom: 6 }}>Ngày biến động</label>
            <input type="date" value={ngayBienDong} onChange={e => setNgayBienDong(e.target.value)} style={{ width: '100%', padding: '8px 11px', border: '1.5px solid #e0e0e0', borderRadius: 7, fontSize: 13 }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', marginBottom: 6 }}>Nơi đến (nếu chuyển đi)</label>
            <input value={noiDenInput} onChange={e => setNoiDenInput(e.target.value)} placeholder="Tên đơn vị mới..." style={{ width: '100%', padding: '8px 11px', border: '1.5px solid #e0e0e0', borderRadius: 7, fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button onClick={() => handleChangeStatus(TRANG_THAI_DV.ACTIVE)} style={{ padding: '10px', borderRadius: 8, border: 'none', background: '#e8f5e9', color: '#2e7d32', fontWeight: 700, cursor: 'pointer' }}>✅ Đang sinh hoạt</button>
            <button onClick={() => handleChangeStatus(TRANG_THAI_DV.CHUYEN_DEN)} style={{ padding: '10px', borderRadius: 8, border: 'none', background: '#e8f5e9', color: '#1b5e20', fontWeight: 700, cursor: 'pointer' }}>📥 Chuyển đến</button>
            <button onClick={() => handleChangeStatus(TRANG_THAI_DV.CHUYEN_DI)} style={{ padding: '10px', borderRadius: 8, border: 'none', background: '#fff3e0', color: '#e65100', fontWeight: 700, cursor: 'pointer' }}>📤 Chuyển đi</button>
            <button onClick={() => handleChangeStatus(TRANG_THAI_DV.TRUONG_THANH)} style={{ padding: '10px', borderRadius: 8, border: 'none', background: '#f3e8ff', color: '#7c3aed', fontWeight: 700, cursor: 'pointer' }}>🎓 Trưởng thành Đoàn</button>
            <button onClick={() => { if(window.confirm('Xác nhận xóa tên khỏi danh sách?')) handleChangeStatus(TRANG_THAI_DV.XOA_TEN); }} style={{ padding: '10px', borderRadius: 8, border: 'none', background: '#ffeef0', color: '#c8102e', fontWeight: 700, cursor: 'pointer', gridColumn: '1/-1' }}>🗑️ Xóa tên đoàn viên</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
