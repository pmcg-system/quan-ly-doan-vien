import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google'
import { File as FileIcon } from 'lucide-react'
import DocumentManager from './components/DocumentManager'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import MemberManager from './components/MemberManager'
import PlansManager from './components/PlansManager'
import GameManager from './components/GameManager'
import Settings from './components/Settings'
import PlayerMobile from './components/PlayerMobile'
import { RAW_MEMBERS, INIT_PLANS, INIT_QUESTIONS } from './data/constants'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID_HERE'

function AppContent() {
  const FOLDER_ID = '1GvFkzdx-0KAEAUqQ_uyduBH0Er8e4Y1T';
  const DB_FILE_NAME = 'db_quanlydoanvien.json';

  const [activeTab, setActiveTab] = useState('dashboard')
  const [accessToken, setAccessToken] = useState(null)
  
  // LocalStorage Cache System
  const [members, setMembers] = useState(() => {
    const saved = localStorage.getItem('db_members');
    return saved ? JSON.parse(saved) : RAW_MEMBERS;
  })
  const [plans, setPlans] = useState(() => {
    const saved = localStorage.getItem('db_plans');
    return saved ? JSON.parse(saved) : INIT_PLANS;
  })
  const [questions, setQuestions] = useState(() => {
    const saved = localStorage.getItem('db_questions');
    return saved ? JSON.parse(saved) : INIT_QUESTIONS;
  })
  
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('geminiApiKey') || '')
  
  const [syncStatus, setSyncStatus] = useState('Chưa kết nối') // Chưa kết nối, Đang đồng bộ, Đã đồng bộ, Lỗi
  const [driveFileId, setDriveFileId] = useState(null)
  
  const initialLoadDone = useRef(false)

  // Lưu vào LocalStorage mỗi khi có thay đổi
  useEffect(() => {
    localStorage.setItem('db_members', JSON.stringify(members));
    localStorage.setItem('db_plans', JSON.stringify(plans));
    localStorage.setItem('db_questions', JSON.stringify(questions));
    
    // Auto sync to cloud nếu đã load xong và có token
    if (initialLoadDone.current && accessToken) {
      uploadToDrive(members, plans, questions);
    }
  }, [members, plans, questions])

  // Lấy file từ Drive khi vừa đăng nhập
  useEffect(() => {
    if (accessToken) {
      downloadFromDrive();
    } else {
      setSyncStatus('Chưa kết nối');
      setDriveFileId(null);
    }
  }, [accessToken])

  const downloadFromDrive = async () => {
    setSyncStatus('Đang đồng bộ...');
    try {
      // 1. Tìm xem file DB đã tồn tại chưa
      const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${DB_FILE_NAME}' and '${FOLDER_ID}' in parents and trashed=false`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const searchData = await searchRes.json();
      
      if (searchData.error) throw new Error(searchData.error.message);

      if (searchData.files && searchData.files.length > 0) {
        const fileId = searchData.files[0].id;
        setDriveFileId(fileId);
        
        // 2. Tải nội dung file
        const getRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const dbData = await getRes.json();
        
        if (dbData.members) setMembers(dbData.members);
        if (dbData.plans) setPlans(dbData.plans);
        if (dbData.questions) setQuestions(dbData.questions);
        
        setSyncStatus('Đã đồng bộ');
      } else {
        // Chưa có file -> Tạo file mới với dữ liệu hiện tại
        setSyncStatus('Tạo CSDL Đám mây...');
        await uploadToDrive(members, plans, questions, true);
      }
      initialLoadDone.current = true;
    } catch (error) {
      console.error("Lỗi đồng bộ:", error);
      setSyncStatus('Lỗi đồng bộ');
    }
  };

  const uploadToDrive = async (m, p, q, isCreate = false) => {
    setSyncStatus('Đang lưu lên Đám mây...');
    try {
      const dbContent = JSON.stringify({ members: m, plans: p, questions: q });
      const metadata = {
        name: DB_FILE_NAME,
        mimeType: 'application/json'
      };
      if (isCreate || !driveFileId) {
        metadata.parents = [FOLDER_ID];
      }

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([dbContent], { type: 'application/json' }));

      const url = (isCreate || !driveFileId) 
        ? 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart'
        : `https://www.googleapis.com/upload/drive/v3/files/${driveFileId}?uploadType=multipart`;
      
      const method = (isCreate || !driveFileId) ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form
      });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error.message);
      if (isCreate || !driveFileId) setDriveFileId(data.id);
      
      setSyncStatus('Đã đồng bộ');
    } catch (error) {
      console.error("Lỗi lưu lên Drive:", error);
      setSyncStatus('Lỗi đồng bộ');
    }
  };

  const login = useGoogleLogin({
    onSuccess: (codeResponse) => setAccessToken(codeResponse.access_token),
    onError: (error) => console.log('Login Failed:', error),
    scope: 'https://www.googleapis.com/auth/drive'
  })

  const logout = () => setAccessToken(null)

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard members={members} />
      case 'members':
        return <MemberManager members={members} setMembers={setMembers} />
      case 'plans':
        return <PlansManager plans={plans} setPlans={setPlans} accessToken={accessToken} onNeedLogin={() => setActiveTab('settings')} />
      case 'games':
        return <GameManager questions={questions} setQuestions={setQuestions} geminiApiKey={geminiApiKey} onNeedSettings={() => setActiveTab('settings')} />
      case 'settings':
        return <Settings accessToken={accessToken} login={login} logout={logout} geminiApiKey={geminiApiKey} setGeminiApiKey={setGeminiApiKey} syncStatus={syncStatus} />
      case 'documents':
        return (
          <div className="space-y-6">
            {accessToken ? (
              <DocumentManager accessToken={accessToken} />
            ) : (
              <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center flex flex-col items-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 mb-6">
                  <FileIcon className="h-10 w-10 text-blue-500" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Chưa kết nối Google Drive</h2>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Để xem và tải lên văn bản, bạn cần đăng nhập Google tại tab <strong>Cài đặt</strong> trước.
                </p>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="px-8 py-3 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                >
                  Đi đến Cài đặt để đăng nhập
                </button>
              </div>
            )}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default function RootApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/play" element={<PlayerMobile />} />
        <Route path="/" element={
          <GoogleOAuthProvider clientId={clientId}>
            <AppContent />
          </GoogleOAuthProvider>
        } />
      </Routes>
    </BrowserRouter>
  )
}
