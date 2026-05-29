import React, { useState } from 'react';
import { Modal, FI, FS, FT, Btn } from './UI';
import { RED, GREEN, GOLD, NAVY, TEAL, getBranchConfig } from '../data/constants';
import { Sparkles, Copy, FileText, Upload, RefreshCw, Eye, Download, Check, Edit3, Plus, Trash2 } from 'lucide-react';

async function uploadFileToDrive(file, folderId, apiUrl) {
  if (!apiUrl) {
    throw new Error("Chưa cấu hình Google Apps Script URL cho Chi đoàn này!");
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result.split(',')[1];
        const payload = {
          action: 'upload_file',
          folderId: folderId,
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          base64: base64
        };

        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.status === 'success') {
          resolve({ id: data.fileId, name: file.name, webViewLink: data.url });
        } else {
          reject(new Error(data.message || 'Lỗi không xác định'));
        }
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(new Error("Lỗi đọc file"));
    reader.readAsDataURL(file);
  });
}

// Hàm phụ gọi API Gemini hỗ trợ tuyển chọn model
async function callGeminiAPI(prompt, geminiApiKey, fileObj = null) {
  const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`);
  const modelsData = await modelsRes.json();
  if (modelsData.error) throw new Error("Lỗi API Key: " + modelsData.error.message);

  const availableModels = modelsData.models || [];
  const supportedModels = availableModels
    .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
    .map(m => m.name.replace('models/', ''))
    .sort((a, b) => {
      if (a.includes('flash') && !b.includes('flash')) return -1;
      if (!a.includes('flash') && b.includes('flash')) return 1;
      if (a.includes('pro') && !b.includes('pro')) return -1;
      if (!a.includes('pro') && b.includes('pro')) return 1;
      return 0;
    });

  if (supportedModels.length === 0) {
    throw new Error("Không tìm thấy mô hình AI phù hợp.");
  }

  let lastError = null;
  for (const model of supportedModels) {
    try {
      const parts = [];
      if (fileObj) {
        parts.push({
          inlineData: {
            mimeType: fileObj.mimeType,
            data: fileObj.base64Data
          }
        });
      }
      parts.push({ text: prompt });

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }]
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data.candidates[0].content.parts[0].text;
    } catch (err) {
      console.warn(`Model ${model} thất bại:`, err.message);
      lastError = err;
    }
  }
  throw lastError || new Error("Tất cả các AI models đều bị lỗi!");
}

export default function PlansManager({ plans, setPlans, isAdmin, geminiApiKey, currentUser }) {
  const [subTab, setSubTab] = useState('list'); // list | ai_plan | ai_report
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState(null); // file object chưa upload
  const [editingPlan, setEditingPlan] = useState(null); // plan đang sửa
  const [editPendingFile, setEditPendingFile] = useState(null); // file đính kèm mới khi sửa
  const [form, setForm] = useState({
    title: '', category: 'Sinh hoạt', startDate: '', endDate: '',
    status: 'Kế hoạch', responsible: '', description: '', attachment: null
  });

  // State hỗ trợ viết kế hoạch bằng AI
  const [uploadedFile, setUploadedFile] = useState(null);
  const [additionalReq, setAdditionalReq] = useState('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generatedPlanText, setGeneratedPlanText] = useState('');
  const [planTitle, setPlanTitle] = useState('');
  const [planDocNo, setPlanDocNo] = useState('03');

  // State hỗ trợ soạn báo cáo
  const [reportPeriod, setReportPeriod] = useState('tháng'); // tháng | quý
  const [reportPeriodVal, setReportPeriodVal] = useState('01'); 
  const [reportYear, setReportYear] = useState(new Date().getFullYear().toString());
  const [reportResult, setReportResult] = useState('');
  const [reportNext, setReportNext] = useState('');
  const [reportDocNo, setReportDocNo] = useState('03');
  const [signDay, setSignDay] = useState(() => {
    const today = new Date();
    return `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
  });
  const [generatedReportText, setGeneratedReportText] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // States phụ hiển thị Toast hoặc Copy Success
  const [copiedText, setCopiedText] = useState(false);

  const cc = { 'Sinh hoạt': RED, 'Tình nguyện': GREEN, 'Khởi nghiệp': GOLD, 'Giáo dục': NAVY, 'Thể thao': TEAL };
  const sc = { 'Hoàn thành': GREEN, 'Đang thực hiện': GOLD, 'Kế hoạch': '#aaa' };

  const resetForm = () => {
    setForm({ title: '', category: 'Sinh hoạt', startDate: '', endDate: '', status: 'Kế hoạch', responsible: '', description: '', attachment: null });
    setPendingFile(null);
  };

  const handleSave = async () => {
    if (!isAdmin) {
      alert("Tài khoản khách không có quyền thêm mới kế hoạch!");
      return;
    }
    if (!form.title) return;
    setUploading(true);
    const config = getBranchConfig(currentUser?.username);
    try {
      let attachment = null;
      let uploadedObj = null;
      if (pendingFile) {
        uploadedObj = await uploadFileToDrive(pendingFile, config.folderKeHoach, config.apiUrl);
        attachment = {
          name: uploadedObj.name,
          fileId: uploadedObj.id,
          viewUrl: uploadedObj.webViewLink,
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

  const handleDeletePlan = (id) => {
    if (!isAdmin) {
      alert("Tài khoản khách không có quyền xóa kế hoạch!");
      return;
    }
    if (window.confirm("Bạn có chắc chắn muốn xóa kế hoạch này? (Lưu ý: Không thể khôi phục)")) {
      setPlans(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleOpenEdit = (plan) => {
    if (!isAdmin) return;
    setEditingPlan({ ...plan });
    setEditPendingFile(null);
  };

  const handleUpdatePlan = async () => {
    if (!editingPlan || !editingPlan.title) return;
    setUploading(true);
    const config = getBranchConfig(currentUser?.username);
    try {
      let attachment = editingPlan.attachment;
      if (editPendingFile) {
        const uploadedObj = await uploadFileToDrive(editPendingFile, config.folderKeHoach, config.apiUrl);
        attachment = {
          name: uploadedObj.name,
          fileId: uploadedObj.id,
          viewUrl: uploadedObj.webViewLink,
        };
      }
      setPlans(prev => prev.map(p => p.id === editingPlan.id ? { ...editingPlan, attachment } : p));
      setEditingPlan(null);
      setEditPendingFile(null);
    } catch (err) {
      alert('Lỗi tải file lên Drive: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Hàm sinh tiêu đề 2 bên dạng plain-text căn lề bằng khoảng trắng
  const generateTwoColumnHeader = (signDate, docNo) => {
    const leftLines = [
      "ĐOÀN THANH NIÊN",
      "BỆNH VIỆN THAN – KHOÁNG SẢN",
      "BCH ĐOÀN THANH NIÊN",
      "TTYT THAN KHU VỰC MẠO KHÊ",
      `Số: ${docNo}`
    ];
    const rightLines = [
      "ĐOÀN TNCS HỒ CHÍ MINH",
      "",
      "",
      signDate
    ];
    
    const plainTextLines = [];
    const maxLeftLen = Math.max(...leftLines.map(l => l.length));
    const padWidth = Math.max(maxLeftLen + 12, 45); // bảo đảm khoảng cách tối thiểu
    
    for (let i = 0; i < 5; i++) {
      const left = leftLines[i] || "";
      const right = rightLines[i] || "";
      if (left || right) {
        if (right) {
          plainTextLines.push(left.padEnd(padWidth, " ") + right);
        } else {
          plainTextLines.push(left);
        }
      }
    }
    return plainTextLines.join("\n");
  };

  // Hàm sinh bảng HTML không viền để dán vào Word thành bảng 2 cột chuẩn
  const getHeaderHtml = (leftLines, rightLines) => {
    return `<table style="width: 100%; border-collapse: collapse; border: none; font-family: 'Times New Roman', Times, serif; margin-bottom: 25px;">
      <tr style="border: none;">
        <td style="width: 50%; text-align: center; vertical-align: top; border: none; padding: 0; line-height: 1.25;">
          <span style="font-size: 11pt;">${leftLines[0] || ""}</span><br>
          <span style="font-size: 11pt; font-weight: bold;">${leftLines[1] || ""}</span><br>
          <span style="font-size: 11pt; font-weight: bold;">${leftLines[2] || ""}</span><br>
          <span style="font-size: 11pt; font-weight: bold; text-decoration: underline;">${leftLines[3] || ""}</span><br>
          <span style="font-size: 11pt;">${leftLines[4] || ""}</span>
        </td>
        <td style="width: 50%; text-align: center; vertical-align: top; border: none; padding: 0; line-height: 1.25;">
          <span style="font-size: 11pt; font-weight: bold;">${rightLines[0] || ""}</span><br>
          <br>
          <span style="font-size: 11pt; font-style: italic;">${rightLines[3] || ""}</span>
        </td>
      </tr>
    </table>`;
  };

  // Sao chép thông minh: Plain-text để xem/sửa, HTML để dán vào Word ra định dạng chuẩn
  const copyDocToClipboard = (text) => {
    const lines = text.split('\n');
    const leftLines = [];
    const rightLines = [];
    
    // Phân tích 6 dòng đầu để tách cột trái và phải (dựa trên khoảng trắng kép)
    let headerLineCount = 0;
    for (let i = 0; i < Math.min(lines.length, 6); i++) {
      const line = lines[i];
      const parts = line.split(/\s{2,}/);
      if (parts.length >= 2) {
        leftLines.push(parts[0].trim());
        rightLines.push(parts[1].trim());
        headerLineCount++;
      } else {
        const trimmed = line.trim();
        if (trimmed.includes("ĐOÀN TNCS") || trimmed.includes("Mạo Khê, ngày") || (trimmed.startsWith("Mạo Khê,") && i > 1)) {
          leftLines.push("");
          rightLines.push(trimmed);
          headerLineCount++;
        } else if (trimmed.startsWith("ĐOÀN THANH NIÊN") || trimmed.startsWith("BỆNH VIỆN") || trimmed.startsWith("BCH ĐOÀN") || trimmed.startsWith("TTYT THAN") || trimmed.startsWith("Số:")) {
          leftLines.push(trimmed);
          rightLines.push("");
          headerLineCount++;
        } else {
          // Bắt đầu phần thân văn bản
          break;
        }
      }
    }

    // Đảm bảo đủ các dòng trống để render HTML
    while (leftLines.length < 5) leftLines.push("");
    while (rightLines.length < 5) rightLines.push("");
    // Nếu dòng cuối cùng của rightLines trống nhưng có ở dòng 3 thì đảo lại cho đúng chuẩn
    if (!rightLines[3] && rightLines[2]) {
      rightLines[3] = rightLines[2];
      rightLines[2] = "";
    }

    const bodyLines = lines.slice(headerLineCount);
    const bodyText = bodyLines.join('\n').trim();

    const htmlHeader = getHeaderHtml(leftLines, rightLines);
    
    // Chuyển đổi Markdown thân bài sang HTML đơn giản để MS Word hiểu được
    const htmlBody = bodyLines
      .map(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('###')) {
          return `<h3 style="font-family: 'Times New Roman'; font-size: 13pt; font-weight: bold; margin-top: 10px; margin-bottom: 4px;">${trimmed.replace(/###/g, '').trim()}</h3>`;
        }
        if (trimmed.startsWith('##')) {
          return `<h2 style="font-family: 'Times New Roman'; font-size: 14pt; font-weight: bold; margin-top: 14px; margin-bottom: 6px;">${trimmed.replace(/##/g, '').trim()}</h2>`;
        }
        if (trimmed.startsWith('#')) {
          return `<h1 style="font-family: 'Times New Roman'; font-size: 15pt; font-weight: bold; text-align: center; margin-top: 18px; margin-bottom: 8px;">${trimmed.replace(/#/g, '').trim()}</h1>`;
        }
        if (trimmed.startsWith('-')) {
          return `<li style="font-family: 'Times New Roman'; font-size: 12pt; margin-left: 20px; margin-bottom: 3px;">${trimmed.replace(/^-/g, '').trim()}</li>`;
        }
        if (trimmed.startsWith('*')) {
          return `<li style="font-family: 'Times New Roman'; font-size: 12pt; margin-left: 20px; margin-bottom: 3px;">${trimmed.replace(/^\*/g, '').trim()}</li>`;
        }
        if (trimmed) {
          return `<p style="font-family: 'Times New Roman'; font-size: 12pt; text-indent: 1.27cm; text-align: justify; line-height: 1.25; margin-bottom: 5px;">${trimmed}</p>`;
        }
        return '<br>';
      })
      .join('');

    const fullHtml = `<html><body style="font-family: 'Times New Roman'; font-size: 12pt; line-height: 1.25;">
      ${htmlHeader}
      ${htmlBody}
    </body></html>`;

    try {
      const blobText = new Blob([text], { type: 'text/plain' });
      const blobHtml = new Blob([fullHtml], { type: 'text/html' });
      const data = [new ClipboardItem({ 'text/plain': blobText, 'text/html': blobHtml })];
      navigator.clipboard.write(data).then(() => {
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2000);
      }).catch(() => {
        navigator.clipboard.writeText(text);
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2000);
      });
    } catch (e) {
      navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  // Xử lý tệp tải lên phục vụ viết kế hoạch AI
  const handlePlanFileChange = (e) => {
    if (!isAdmin) {
      alert("Tài khoản khách không có quyền tải tài liệu lên!");
      return;
    }
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Tệp quá lớn! Vui lòng chọn tệp dưới 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedFile({
        name: file.name,
        mimeType: file.type,
        base64Data: reader.result.split(',')[1]
      });
    };
    reader.readAsDataURL(file);
  };

  // AI Viết Kế Hoạch từ văn bản cấp trên
  const handleGeneratePlan = async () => {
    if (!isAdmin) {
      alert("Tài khoản khách không có quyền soạn kế hoạch!");
      return;
    }
    if (!geminiApiKey) {
      alert("Vui lòng cấu hình Gemini API Key tại tab Cài đặt trước!");
      return;
    }
    if (!uploadedFile) {
      alert("Vui lòng tải lên kế hoạch/công văn của cấp trên!");
      return;
    }

    setIsGeneratingPlan(true);
    setGeneratedPlanText('');

    const prompt = `Bạn là một Bí thư Chi đoàn xuất sắc của "Chi đoàn Trung tâm Y tế Than khu vực Mạo Khê".
Dựa trên tài liệu đính kèm (là văn bản/kế hoạch của Đoàn cấp trên)${additionalReq.trim() ? `, và yêu cầu bổ sung đặc biệt sau: "${additionalReq}"` : ''},
hãy viết một bản KẾ HOẠCH chi tiết và cụ thể để Chi đoàn chúng ta triển khai thực hiện.

QUAN TRỌNG: Hãy chỉ tập trung viết nội dung phần thân kế hoạch, bắt đầu thẳng bằng:
KẾ HOẠCH
Về việc: [Nêu chủ đề kế hoạch cụ thể của chúng ta]

I. MỤC ĐÍCH - YÊU CẦU
- Nêu cụ thể mục đích của hoạt động.
- Nêu rõ các yêu cầu về tinh thần, thái độ, nhân lực.

II. THỜI GIAN - ĐỊA ĐIỂM
- Thời gian: [Thời gian thực hiện cụ thể]
- Địa điểm: [Địa điểm thực hiện]

III. NỘI DUNG HOẠT ĐỘNG
- [Xây dựng các nội dung công việc chi tiết, thiết thực dựa trên văn bản cấp trên]

IV. TỔ CHỨC THỰC HIỆN
- Phân công người chịu trách nhiệm chính.
- Phân công cụ thể cho các tổ đoàn viên, hậu cần, truyền thông...
- Trách nhiệm báo cáo kết quả.

TM. BAN CHẤP HÀNH
BÍ THƯ

Đặng Phong Thái

Yêu cầu: Hãy viết rất chi tiết, phong thái trang nghiêm, chuyên nghiệp. Không chèn các ký tự lạ, trả về định dạng Markdown.`;

    try {
      const result = await callGeminiAPI(prompt, geminiApiKey, uploadedFile);
      
      // Tạo header 2 cột ghép vào
      const today = new Date();
      const signDate = `Mạo Khê, ngày ${today.getDate().toString().padStart(2, '0')} tháng ${(today.getMonth() + 1).toString().padStart(2, '0')} năm ${today.getFullYear()}`;
      const headerText = generateTwoColumnHeader(signDate, planDocNo);
      
      const fullDoc = `${headerText}\n\n${result}`;
      setGeneratedPlanText(fullDoc);
      
      // Thử tự động trích xuất tiêu đề kế hoạch
      const titleMatch = result.match(/Về việc:\s*(.*)/i) || result.match(/KẾ HOẠCH\s*\n\s*(.*)/i);
      if (titleMatch && titleMatch[1]) {
        setPlanTitle(titleMatch[1].replace(/[*_#]/g, '').trim());
      } else {
        setPlanTitle("Kế hoạch triển khai nhiệm vụ mới");
      }
    } catch (err) {
      alert("Lỗi khi soạn kế hoạch bằng AI: " + err.message);
    } finally {
      setIsGeneratingPlan(false);
    }
  };


  // Lưu bản kế hoạch AI tạo ra thành 1 thẻ kế hoạch trong danh sách
  const handleSaveGeneratedPlan = () => {
    if (!isAdmin) {
      alert("Tài khoản khách không có quyền lưu kế hoạch!");
      return;
    }
    if (!planTitle.trim()) {
      alert("Vui lòng nhập tên hoạt động/kế hoạch!");
      return;
    }
    const newPlan = {
      id: Date.now(),
      title: planTitle.trim(),
      category: 'Sinh hoạt',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      status: 'Kế hoạch',
      responsible: 'Đặng Phong Thái',
      description: generatedPlanText.slice(0, 300) + (generatedPlanText.length > 300 ? '...' : ''),
      attachment: null
    };

    setPlans(prev => [newPlan, ...prev]);
    alert("🎉 Đã thêm kế hoạch vào Danh sách thành công!");
    setSubTab('list');
  };

  // HÀM TẠO BÁO CÁO THỦ CÔNG NHANH (CLIENT-SIDE)
  const generateManualReport = () => {
    let nextPeriodVal = '';
    let nextPeriodYear = reportYear;

    if (reportPeriod === 'tháng') {
      const m = parseInt(reportPeriodVal, 10);
      if (m === 12) {
        nextPeriodVal = '01';
        nextPeriodYear = (parseInt(reportYear, 10) + 1).toString();
      } else {
        const nm = m + 1;
        nextPeriodVal = nm < 10 ? `0${nm}` : nm.toString();
      }
    } else {
      const q = reportPeriodVal;
      if (q === 'I') nextPeriodVal = 'II';
      else if (q === 'II') nextPeriodVal = 'III';
      else if (q === 'III') nextPeriodVal = 'IV';
      else {
        nextPeriodVal = 'I';
        nextPeriodYear = (parseInt(reportYear, 10) + 1).toString();
      }
    }

    const titlePeriod = reportPeriod === 'tháng' ? `THÁNG ${reportPeriodVal}` : `QUÝ ${reportPeriodVal}`;
    const nextTitlePeriod = reportPeriod === 'tháng' ? `THÁNG ${nextPeriodVal}` : `QUÝ ${nextPeriodVal}`;

    const formattedResult = reportResult.trim() 
      ? reportResult.split('\n').map(l => l.startsWith('-') ? l : `- ${l}`).join('\n')
      : '- Duy trì các công trình thanh niên tự quản.\n- Tham gia đầy đủ các hoạt động của Đoàn cấp trên.';

    const formattedNext = reportNext.trim()
      ? reportNext.split('\n').map(l => l.startsWith('-') ? l : `- ${l}`).join('\n')
      : '- Tiếp tục duy trì công tác vệ sinh khuôn viên.\n- Tổ chức các buổi sinh hoạt định kỳ.';

    // Chuẩn hóa ngày ký sang dạng tiếng Việt chính thức
    let formattedSignDate = signDay;
    if (!signDay.includes("ngày") && signDay.includes("/")) {
      const p = signDay.split('/');
      if (p.length === 3) formattedSignDate = `Mạo Khê, ngày ${p[0]} tháng ${p[1]} năm ${p[2]}`;
    }

    const headerText = generateTwoColumnHeader(formattedSignDate, `${reportDocNo}-BC/ĐTNTT`);

    const template = `${headerText}

BÁO CÁO
KẾT QUẢ HOẠT ĐỘNG CÔNG TÁC ĐOÀN VÀ PHONG TRÀO THANH NIÊN ${titlePeriod} VÀ PHƯƠNG HƯỚNG ${nextTitlePeriod.toUpperCase()} - NĂM ${reportYear}
------------------------
Thực hiện Kế hoạch của BCH Đoàn thanh niên Bệnh viện Than - Khoáng sản về công tác đoàn năm ${reportYear}. Được sự quan tâm chỉ đạo trực tiếp của Chi bộ Trung tâm, từ tình hình hoạt động chung của toàn trung tâm. BCH Chi đoàn thanh niên Trung tâm y tế Than khu vực Mạo Khê báo cáo:

I. Kết quả hoạt động trong ${reportPeriod} ${reportPeriodVal}/${reportYear}
${formattedResult}

II. Kế hoạch hoạt động ${reportPeriod === 'tháng' ? 'tháng' : 'quý'} ${nextPeriodVal}/${nextPeriodYear}
${formattedNext}

Trên đây là kết quả hoạt động công tác đoàn và phong trào TTN của Chi đoàn thanh niên Trung tâm Y tế Than khu vực Mạo Khê trong ${reportPeriod} ${reportPeriodVal}/${reportYear} và triển khai phương hướng nhiệm vụ trọng tâm trong ${reportPeriod === 'tháng' ? 'tháng' : 'quý'} ${nextPeriodVal}/${nextPeriodYear}.

TM. BAN CHẤP HÀNH
BÍ THƯ



Đặng Phong Thái`;

    setGeneratedReportText(template);
  };

  // AI TỐI ƯU HÓA & BIÊN SOẠN CHI TIẾT BÁO CÁO
  const handleAIReportOptimize = async () => {
    if (!geminiApiKey) {
      alert("Vui lòng cấu hình Gemini API Key tại tab Cài đặt trước!");
      return;
    }
    if (!reportResult.trim() && !reportNext.trim()) {
      alert("Vui lòng điền nội dung kết quả hoặc phương hướng để AI tối ưu!");
      return;
    }

    setIsGeneratingReport(true);
    setGeneratedReportText('');

    let nextPeriodVal = '';
    let nextPeriodYear = reportYear;

    if (reportPeriod === 'tháng') {
      const m = parseInt(reportPeriodVal, 10);
      if (m === 12) {
        nextPeriodVal = '01';
        nextPeriodYear = (parseInt(reportYear, 10) + 1).toString();
      } else {
        const nm = m + 1;
        nextPeriodVal = nm < 10 ? `0${nm}` : nm.toString();
      }
    } else {
      const q = reportPeriodVal;
      if (q === 'I') nextPeriodVal = 'II';
      else if (q === 'II') nextPeriodVal = 'III';
      else if (q === 'III') nextPeriodVal = 'IV';
      else {
        nextPeriodVal = 'I';
        nextPeriodYear = (parseInt(reportYear, 10) + 1).toString();
      }
    }

    const prompt = `Bạn là Bí thư Chi đoàn "Chi đoàn Trung tâm Y tế Than khu vực Mạo Khê".
Hãy tối ưu hóa và trau chuốt nội dung các điểm hoạt động dưới đây thành một bản Báo cáo chính thức, trang trọng, văn phong chuẩn Đoàn Thanh niên Cộng sản Hồ Chí Minh.

Thông tin báo cáo:
- Kỳ báo cáo: ${reportPeriod} ${reportPeriodVal} năm ${reportYear}
- Kết quả hoạt động trong kỳ:
${reportResult}
- Phương hướng nhiệm vụ kỳ tới:
${reportNext}

QUAN TRỌNG: Hãy chỉ tập trung viết nội dung phần thân báo cáo, bắt đầu thẳng bằng:
BÁO CÁO
KẾT QUẢ HOẠT ĐỘNG CÔNG TÁC ĐOÀN VÀ PHONG TRÀO THANH NIÊN ${reportPeriod === 'tháng' ? 'THÁNG' : 'QUÝ'} ${reportPeriodVal} VÀ PHƯƠNG HƯỚNG ${reportPeriod === 'tháng' ? 'THÁNG' : 'QUÝ'} ${nextPeriodVal} - NĂM ${reportYear}
------------------------
Thực hiện Kế hoạch của BCH Đoàn thanh niên Bệnh viện Than - Khoáng sản về công tác đoàn năm ${reportYear}. Được sự quan tâm chỉ đạo trực tiếp của Chi bộ Trung tâm, từ tình hình hoạt động chung của toàn trung tâm. BCH Chi đoàn thanh niên Trung tâm y tế Than khu vực Mạo Khê báo cáo:

I. Kết quả hoạt động trong ${reportPeriod} ${reportPeriodVal}/${reportYear}
[Các kết quả hoạt động được trau chuốt, bổ sung từ ngữ trang trọng, trình bày dạng gạch đầu dòng chi tiết]

II. Kế hoạch hoạt động ${reportPeriod === 'tháng' ? 'tháng' : 'quý'} ${nextPeriodVal}/${nextPeriodYear}
[Các phương hướng nhiệm vụ được trau chuốt, bổ sung từ ngữ trang trọng, trình bày dạng gạch đầu dòng chi tiết]

Trên đây là kết quả hoạt động công tác đoàn và phong trào TTN của Chi đoàn thanh niên Trung tâm Y tế Than khu vực Mạo Khê trong ${reportPeriod} ${reportPeriodVal}/${reportYear} và triển khai phương hướng nhiệm vụ trọng tâm trong ${reportPeriod === 'tháng' ? 'tháng' : 'quý'} ${nextPeriodVal}/${nextPeriodYear}.

TM. BAN CHẤP HÀNH
BÍ THƯ

Đặng Phong Thái

Yêu cầu: Hãy tối ưu hóa từ ngữ cho thật chuyên nghiệp, súc tích nhưng đầy đủ ý nghĩa, khoa học. Trả về nội dung bản báo cáo hoàn chỉnh dưới định dạng Markdown sạch sẽ.`;

    try {
      const result = await callGeminiAPI(prompt, geminiApiKey);
      
      let formattedSignDate = signDay;
      if (!signDay.includes("ngày") && signDay.includes("/")) {
        const p = signDay.split('/');
        if (p.length === 3) formattedSignDate = `Mạo Khê, ngày ${p[0]} tháng ${p[1]} năm ${p[2]}`;
      }
      
      const headerText = generateTwoColumnHeader(formattedSignDate, `${reportDocNo}-BC/ĐTNTT`);
      setGeneratedReportText(`${headerText}\n\n${result}`);
    } catch (err) {
      alert("Lỗi khi tối ưu báo cáo bằng AI: " + err.message);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Tab Selector dạng Menu Tab đẹp mắt */}
      <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1">
        <button
          onClick={() => setSubTab('list')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${subTab === 'list' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          <FileText size={16} /> Danh sách kế hoạch
        </button>
        <button
          onClick={() => setSubTab('ai_plan')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${subTab === 'ai_plan' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          <Sparkles size={16} /> Soạn kế hoạch (AI)
        </button>
        <button
          onClick={() => setSubTab('ai_report')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${subTab === 'ai_report' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          <Edit3 size={16} /> Soạn báo cáo
        </button>
      </div>

      {copiedText && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-2.5 rounded-xl shadow-lg z-50 text-sm font-bold flex items-center gap-2">
          <Check size={16} /> Đã sao chép vào bộ nhớ tạm!
        </div>
      )}

      {/* SUB-TAB 1: DANH SÁCH KẾ HOẠCH */}
      {subTab === 'list' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 22, color: '#1a1a2e' }}>📋 Kế hoạch hoạt động</h2>
            {isAdmin && <Btn onClick={() => setShowForm(true)}>+ Thêm kế hoạch</Btn>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
            {plans.map(p => (
              <div key={p.id} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                <div style={{ background: cc[p.category] || RED, padding: '14px 18px', color: '#fff', position: 'relative' }}>
                  <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{p.category}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginTop: 4, lineHeight: 1.4, paddingRight: 56 }}>{p.title}</div>
                  {isAdmin && (
                    <div className="absolute top-3 right-3 flex gap-1">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 bg-white/20 hover:bg-white/40 rounded-lg transition-colors cursor-pointer text-white"
                        title="Sửa kế hoạch"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeletePlan(p.id)}
                        className="p-1.5 bg-white/20 hover:bg-white/40 rounded-lg transition-colors cursor-pointer text-white"
                        title="Xóa kế hoạch"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 12, color: '#aaa', marginBottom: 8 }}>📅 {p.startDate} → {p.endDate}</div>
                  <p style={{ margin: '0 0 12px', fontSize: 13, color: '#666', lineHeight: 1.6 }} className="line-clamp-4">{p.description}</p>
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
                        <a href={p.attachment.viewUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, padding: '5px 12px', background: '#f0f0f0', color: '#333', borderRadius: 6, textDecoration: 'none', fontWeight: 700 }}>👁 Xem</a>
                        <a href={p.attachment.downloadUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, padding: '5px 12px', background: '#eef2ff', color: '#4f46e5', borderRadius: 6, textDecoration: 'none', fontWeight: 700 }}>⬇ Tải về</a>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FI label="Ngày bắt đầu" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                <FI label="Ngày kết thúc" type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
              </div>
              <FS label="Trạng thái" opts={['Kế hoạch', 'Đang thực hiện', 'Hoàn thành']} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} />
              <FI label="Người phụ trách" value={form.responsible} onChange={e => setForm({ ...form, responsible: e.target.value })} />
              <FT label="Mô tả" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <div style={{ marginBottom: 11 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: 0.4 }}>Đính kèm tệp tin (Google Drive)</label>
                <div style={{ border: '1.5px dashed #ccc', borderRadius: 8, background: '#fafafa', padding: '10px 14px' }}>
                  <input type="file" onChange={e => setPendingFile(e.target.files[0] || null)} style={{ fontSize: 13, width: '100%' }} />
                  {pendingFile && <div style={{ marginTop: 6, fontSize: 12, color: '#34A853', fontWeight: 600 }}>✅ Đã chọn: {pendingFile.name} ({(pendingFile.size / 1024).toFixed(1)} KB) — Sẽ tải lên Drive khi Lưu</div>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14, paddingTop: 10, borderTop: '1px solid #eee' }}>
                <Btn v="s" onClick={() => { setShowForm(false); resetForm(); }}>Hủy</Btn>
                <Btn onClick={handleSave} disabled={uploading}>{uploading ? '⏳ Đang tải lên Drive...' : '💾 Lưu kế hoạch'}</Btn>
              </div>
            </Modal>
          )}
 
          {editingPlan && (
            <Modal title="✏️ Chỉnh sửa kế hoạch" onClose={() => setEditingPlan(null)}>
              <FI label="Tên hoạt động *" value={editingPlan.title} onChange={e => setEditingPlan({ ...editingPlan, title: e.target.value })} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FI label="Ngày bắt đầu" type="date" value={editingPlan.startDate} onChange={e => setEditingPlan({ ...editingPlan, startDate: e.target.value })} />
                <FI label="Ngày kết thúc" type="date" value={editingPlan.endDate} onChange={e => setEditingPlan({ ...editingPlan, endDate: e.target.value })} />
              </div>
              <FS label="Trạng thái" opts={['Kế hoạch', 'Đang thực hiện', 'Hoàn thành']} value={editingPlan.status} onChange={e => setEditingPlan({ ...editingPlan, status: e.target.value })} />
              <FI label="Người phụ trách" value={editingPlan.responsible} onChange={e => setEditingPlan({ ...editingPlan, responsible: e.target.value })} />
              <FT label="Mô tả" value={editingPlan.description} onChange={e => setEditingPlan({ ...editingPlan, description: e.target.value })} />
              
              {editingPlan.status !== 'Hoàn thành' && (
                <div style={{ marginBottom: 11 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: 0.4 }}>Cập nhật đính kèm tệp tin (Google Drive)</label>
                  {editingPlan.attachment && (
                    <div style={{ fontSize: 12, color: '#4b5563', marginBottom: 6 }}>
                      Tệp hiện tại: <span style={{ fontWeight: 600 }}>{editingPlan.attachment.name}</span>
                    </div>
                  )}
                  <div style={{ border: '1.5px dashed #ccc', borderRadius: 8, background: '#fafafa', padding: '10px 14px' }}>
                    <input type="file" onChange={e => setEditPendingFile(e.target.files[0] || null)} style={{ fontSize: 13, width: '100%' }} />
                    {editPendingFile && <div style={{ marginTop: 6, fontSize: 12, color: '#34A853', fontWeight: 600 }}>✅ Đã chọn: {editPendingFile.name} ({(editPendingFile.size / 1024).toFixed(1)} KB) — Sẽ tải lên Drive khi Lưu</div>}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14, paddingTop: 10, borderTop: '1px solid #eee' }}>
                <Btn v="s" onClick={() => setEditingPlan(null)}>Hủy</Btn>
                <Btn onClick={handleUpdatePlan} disabled={uploading}>{uploading ? '⏳ Đang tải lên Drive...' : '💾 Lưu thay đổi'}</Btn>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* SUB-TAB 2: SOẠN KẾ HOẠCH BẰNG AI */}
      {subTab === 'ai_plan' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Cột trái: Cấu hình và Tải tệp */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Sparkles className="text-purple-600" size={20} /> Viết kế hoạch từ cấp trên
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Tải lên công văn/yêu cầu của Đoàn cấp trên (PDF hoặc Ảnh). AI sẽ biên soạn thành bản kế hoạch chi tiết, bài bản cho Chi đoàn.
              </p>

              {!geminiApiKey && (
                <div className="p-4 bg-yellow-50 text-yellow-800 rounded-xl border border-yellow-200 text-xs leading-relaxed">
                  ⚠️ Chưa cấu hình Gemini API Key. Bạn cần vào tab <strong>Cài đặt</strong> để nhập khóa trước khi sử dụng tính năng này.
                </div>
              )}

              {/* Tải tệp lên */}
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5 uppercase tracking-wider">Tài liệu cấp trên (PDF hoặc Ảnh)</label>
                {!isAdmin ? (
                  <div className="border border-dashed border-red-200 rounded-xl p-4 bg-red-50 text-center">
                    <p className="text-xs font-bold text-red-600">🔒 Tài khoản khách không được phép tải lên tài liệu.</p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50 text-center hover:bg-gray-100 transition-colors relative cursor-pointer">
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      onChange={handlePlanFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                    {uploadedFile ? (
                      <div>
                        <p className="text-sm font-semibold text-blue-600 truncate">{uploadedFile.name}</p>
                        <p className="text-xs text-gray-400">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-600">Click để chọn hoặc kéo thả tệp</p>
                        <p className="text-xs text-gray-400">Hỗ trợ định dạng PDF, PNG, JPG</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Số kế hoạch */}
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5 uppercase tracking-wider">Số kế hoạch</label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                  <span className="text-xs text-gray-400 font-bold uppercase">Số:</span>
                  <input
                    type="text"
                    value={planDocNo}
                    onChange={e => setPlanDocNo(e.target.value)}
                    placeholder="VD: 03"
                    className="w-16 bg-white border border-gray-200 rounded-lg px-2 py-1 text-center text-sm outline-none focus:border-blue-400 font-bold text-gray-700"
                  />
                  <span className="text-sm font-semibold text-gray-500">/KH-ĐTNTT</span>
                </div>
              </div>

              {/* Yêu cầu thêm */}
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5 uppercase tracking-wider">Yêu cầu bổ sung (Tùy chọn)</label>
                <textarea
                  value={additionalReq}
                  onChange={e => setAdditionalReq(e.target.value)}
                  placeholder="Ví dụ: Tập trung phân công tổ đoàn y bác sĩ trẻ phụ trách chính; yêu cầu tổ chức vào sáng Chủ nhật..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                  rows={3}
                />
              </div>

              <button
                onClick={handleGeneratePlan}
                disabled={isGeneratingPlan || !uploadedFile || !geminiApiKey}
                className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-700 disabled:opacity-50 transition-all shadow-md shadow-purple-100"
              >
                {isGeneratingPlan ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
                {isGeneratingPlan ? 'AI đang phân tích & soạn kế hoạch...' : 'AI viết kế hoạch chi tiết'}
              </button>
            </div>

            {/* Lưu thành Thẻ kế hoạch */}
            {generatedPlanText && isAdmin && (
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Tạo thẻ kế hoạch hoạt động</h4>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1.5">Tên hoạt động thẻ</label>
                  <input
                    value={planTitle}
                    onChange={e => setPlanTitle(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                  />
                </div>
                <button
                  onClick={handleSaveGeneratedPlan}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
                >
                  💾 Lưu vào danh sách kế hoạch
                </button>
              </div>
            )}
          </div>

          {/* Cột phải: Bản xem trước và Soạn thảo */}
          <div className="lg:col-span-3 flex flex-col h-[75vh]">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col flex-1 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <FileText className="text-blue-600" size={16} /> Nội dung kế hoạch soạn thảo
                </h3>
                {generatedPlanText && (
                  <button
                    onClick={() => copyDocToClipboard(generatedPlanText)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <Copy size={12} /> Sao chép văn bản
                  </button>
                )}
              </div>
              <div className="flex-1 p-6 overflow-y-auto">
                {generatedPlanText ? (
                  <textarea
                    value={generatedPlanText}
                    onChange={e => setGeneratedPlanText(e.target.value)}
                    className="w-full h-full font-mono text-sm border-none outline-none resize-none leading-relaxed text-gray-800"
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                    <FileText size={48} className="mb-3 opacity-30" />
                    <p className="text-sm">Bản nháp kế hoạch sẽ được tạo ra tại đây.</p>
                    <p className="text-xs mt-1">Vui lòng tải tệp công văn lên và nhấn nút "AI viết kế hoạch chi tiết".</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SOẠN BÁO CÁO CÔNG TÁC */}
      {subTab === 'ai_report' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Cột trái: Form nhập liệu */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Edit3 className="text-blue-600" size={20} /> Khai báo nội dung Báo cáo
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1.5 uppercase">Kỳ báo cáo</label>
                  <select
                    value={reportPeriod}
                    onChange={e => {
                      setReportPeriod(e.target.value);
                      setReportPeriodVal(e.target.value === 'tháng' ? '01' : 'I');
                    }}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2"
                  >
                    <option value="tháng">Báo cáo Tháng</option>
                    <option value="quý">Báo cáo Quý</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1.5 uppercase">Chi tiết kỳ</label>
                  {reportPeriod === 'tháng' ? (
                    <select
                      value={reportPeriodVal}
                      onChange={e => setReportPeriodVal(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2"
                    >
                      {Array.from({ length: 12 }, (_, i) => {
                        const val = (i + 1).toString().padStart(2, '0');
                        return <option key={val} value={val}>Tháng {val}</option>;
                      })}
                    </select>
                  ) : (
                    <select
                      value={reportPeriodVal}
                      onChange={e => setReportPeriodVal(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2"
                    >
                      <option value="I">Quý I</option>
                      <option value="II">Quý II</option>
                      <option value="III">Quý III</option>
                      <option value="IV">Quý IV</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1.5 uppercase">Năm báo cáo</label>
                  <input
                    type="number"
                    value={reportYear}
                    onChange={e => setReportYear(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1.5 uppercase">Ngày ký báo cáo</label>
                  <input
                    type="text"
                    value={signDay}
                    onChange={e => setSignDay(e.target.value)}
                    placeholder="VD: 20/01/2025"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5 uppercase">Số báo cáo</label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                  <span className="text-xs text-gray-400 font-bold uppercase">Số:</span>
                  <input
                    type="text"
                    value={reportDocNo}
                    onChange={e => setReportDocNo(e.target.value)}
                    placeholder="VD: 03"
                    className="w-16 bg-white border border-gray-200 rounded-lg px-2 py-1 text-center text-sm outline-none focus:border-blue-400 font-bold text-gray-700"
                  />
                  <span className="text-sm font-semibold text-gray-500">/BC-ĐTNTT</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5 uppercase">1. Kết quả đạt được (Ý chính)</label>
                <textarea
                  value={reportResult}
                  onChange={e => setReportResult(e.target.value)}
                  placeholder="Điền các kết quả trong kỳ, mỗi ý một dòng. Ví dụ:&#13;Duy trì vận chuyển bình oxy&#13;Tổ chức ra quân vệ sinh đón Tết âm lịch"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                  rows={4}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5 uppercase">2. Phương hướng kỳ tới (Ý chính)</label>
                <textarea
                  value={reportNext}
                  onChange={e => setReportNext(e.target.value)}
                  placeholder="Điền các hoạt động kế hoạch kỳ tới, mỗi ý một dòng. Ví dụ:&#13;Tổ chức tặng quà trực Tết&#13;Hội thao ngày Thầy thuốc VN 27/2"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                  rows={4}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={generateManualReport}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors"
                >
                  Tạo báo cáo mẫu
                </button>
                <button
                  type="button"
                  onClick={handleAIReportOptimize}
                  disabled={isGeneratingReport || !geminiApiKey}
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md shadow-blue-100 flex items-center justify-center gap-1.5"
                >
                  {isGeneratingReport ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                  {isGeneratingReport ? 'Đang viết...' : 'AI tối ưu báo cáo'}
                </button>
              </div>
            </div>
          </div>

          {/* Cột phải: Bản xem trước báo cáo */}
          <div className="lg:col-span-3 flex flex-col h-[75vh]">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col flex-1 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <FileText className="text-blue-600" size={16} /> Bản xem trước Báo cáo hoàn chỉnh
                </h3>
                {generatedReportText && (
                  <button
                    onClick={() => copyDocToClipboard(generatedReportText)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <Copy size={12} /> Sao chép văn bản
                  </button>
                )}
              </div>
              <div className="flex-1 p-6 overflow-y-auto">
                {generatedReportText ? (
                  <textarea
                    value={generatedReportText}
                    onChange={e => setGeneratedReportText(e.target.value)}
                    className="w-full h-full font-mono text-sm border-none outline-none resize-none leading-relaxed text-gray-800"
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                    <FileText size={48} className="mb-3 opacity-30" />
                    <p className="text-sm">Văn bản báo cáo hoàn chỉnh sẽ hiển thị tại đây.</p>
                    <p className="text-xs mt-1">Vui lòng điền các ý chính bên trái và chọn "Tạo báo cáo mẫu" hoặc "AI tối ưu báo cáo".</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
