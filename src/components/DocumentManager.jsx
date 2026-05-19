import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Upload, File as FileIcon, Download, Eye, Loader2, Trash2, Search, Plus, Filter } from 'lucide-react';

const FOLDER_DEN = import.meta.env.VITE_FOLDER_VAN_BAN_DEN;
const FOLDER_DI = import.meta.env.VITE_FOLDER_VAN_BAN_DI;

export default function DocumentManager({ accessToken }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [previewFile, setPreviewFile] = useState(null);
  
  // State quản lý thư mục hiện tại (Lọc)
  const [activeTab, setActiveTab] = useState('ALL'); 
  
  // State quản lý thư mục khi tải lên
  const [uploadFolder, setUploadFolder] = useState('DEN'); 

  const fileInputRef = useRef(null);

  // Lấy danh sách file từ Google Drive
  const fetchFiles = async () => {
    setLoading(true);
    try {
      // Chỉ lấy file nằm trong 2 thư mục này
      let query = '';
      if (FOLDER_DEN && FOLDER_DI) {
        query = `q=trashed=false and ('${FOLDER_DEN}' in parents or '${FOLDER_DI}' in parents)&`;
      }

      const res = await axios.get(
        `https://www.googleapis.com/drive/v3/files?${query}fields=files(id,name,webViewLink,webContentLink,iconLink,createdTime,mimeType,size,parents)&orderBy=createdTime desc`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setFiles(res.data.files || []);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách file:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [accessToken]);

  // Xử lý upload file
  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Xác định Folder ID
    const targetFolderId = uploadFolder === 'DEN' ? FOLDER_DEN : FOLDER_DI;
    
    if (!targetFolderId) {
      alert("Vui lòng cấu hình Folder ID trong file .env trước khi tải lên!");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    try {
      const metadata = {
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        parents: [targetFolderId] // Đưa file vào thư mục được chọn
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      await axios.post(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        form,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      
      // Tải lại danh sách
      setTimeout(() => fetchFiles(), 1000);
    } catch (error) {
      console.error('Lỗi khi tải file lên:', error);
      alert('Tải file lên thất bại! Vui lòng kiểm tra lại quyền truy cập Drive.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Định dạng ngày tháng
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
  };

  // Lọc file theo tìm kiếm và tab (Văn bản đến / Văn bản đi)
  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
    if (activeTab === 'ALL') return matchesSearch;
    if (activeTab === 'DEN') return matchesSearch && f.parents?.includes(FOLDER_DEN);
    if (activeTab === 'DI') return matchesSearch && f.parents?.includes(FOLDER_DI);
    return false;
  });

  return (
    <div className="space-y-6">
      
      {/* Cảnh báo thiếu cấu hình */}
      {(!FOLDER_DEN || !FOLDER_DI) && (
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl text-sm border border-yellow-200">
          <strong>Lưu ý quan trọng:</strong> Chưa cài đặt ID thư mục `Văn bản đến` và `Văn bản đi` trong file <code>.env</code>. Việc tải lên sẽ không hoạt động chính xác.
        </div>
      )}

      {/* Tabs lọc hiển thị */}
      <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1">
        <button 
          onClick={() => setActiveTab('ALL')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'ALL' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          Tất cả văn bản
        </button>
        <button 
          onClick={() => setActiveTab('DEN')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'DEN' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          Văn bản đến
        </button>
        <button 
          onClick={() => setActiveTab('DI')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'DI' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          Văn bản đi
        </button>
      </div>

      {/* Thanh công cụ */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Tìm kiếm văn bản..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Chọn loại văn bản tải lên */}
          <select 
            value={uploadFolder}
            onChange={(e) => setUploadFolder(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="DEN">Upload vào: Văn bản đến</option>
            <option value="DI">Upload vào: Văn bản đi</option>
          </select>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUpload} 
            className="hidden" 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Upload className="h-5 w-5 mr-2" />
            )}
            {uploading ? 'Đang xử lý...' : 'Tải file lên'}
          </button>
        </div>
      </div>

      {/* Danh sách file */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                <th className="px-6 py-4 font-medium">Tên văn bản</th>
                <th className="px-6 py-4 font-medium">Phân loại</th>
                <th className="px-6 py-4 font-medium">Ngày tạo</th>
                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    Chưa có văn bản nào trong thư mục này.
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img src={file.iconLink} alt="icon" className="w-5 h-5 mr-3" />
                        <span className="font-medium text-gray-900 truncate max-w-[250px] sm:max-w-md" title={file.name}>
                          {file.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${file.parents?.includes(FOLDER_DEN) ? 'bg-green-100 text-green-700' : file.parents?.includes(FOLDER_DI) ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>
                        {file.parents?.includes(FOLDER_DEN) ? 'Văn bản đến' : file.parents?.includes(FOLDER_DI) ? 'Văn bản đi' : 'Khác'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {formatDate(file.createdTime)}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button 
                        onClick={() => setPreviewFile(file)}
                        className="inline-flex items-center p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Xem trước"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <a 
                        href={file.webContentLink} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Tải về"
                      >
                        <Download className="h-5 w-5" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal xem trước (Preview) */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-semibold text-lg flex items-center">
                <img src={previewFile.iconLink} alt="icon" className="w-5 h-5 mr-2" />
                {previewFile.name}
              </h3>
              <button 
                onClick={() => setPreviewFile(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
            <div className="flex-1 bg-gray-100">
              <iframe 
                src={previewFile.webViewLink.replace('/view', '/preview')} 
                className="w-full h-full border-none"
                title="Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
