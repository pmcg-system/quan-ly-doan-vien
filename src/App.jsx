import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { File as FileIcon } from 'lucide-react'
import DocumentManager from './components/DocumentManager'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import MemberManager from './components/MemberManager'
import PlansManager from './components/PlansManager'
import GameManager from './components/GameManager'
import Settings from './components/Settings'
import PlayerMobile from './components/PlayerMobile'
import LoginScreen from './components/LoginScreen'
import FundManager from './components/FundManager'
import AttendanceManager from './components/AttendanceManager'
import { RAW_MEMBERS, INIT_PLANS, INIT_QUESTIONS, getBranchConfig } from './data/constants'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID_HERE'

function AppContent({ currentUser, handleAppLogout }) {
  const isAdmin = currentUser?.role === 'admin';

  const [activeTab, setActiveTab] = useState('dashboard')
  
  // LocalStorage Cache System Scoped by Username
  const [members, setMembers] = useState(() => {
    const saved = localStorage.getItem(`db_members_${currentUser?.username}`);
    return saved ? JSON.parse(saved) : RAW_MEMBERS;
  })
  const [plans, setPlans] = useState(() => {
    const saved = localStorage.getItem(`db_plans_${currentUser?.username}`);
    return saved ? JSON.parse(saved) : INIT_PLANS;
  })
  const [questions, setQuestions] = useState(() => {
    const saved = localStorage.getItem(`db_questions_${currentUser?.username}`);
    return saved ? JSON.parse(saved) : INIT_QUESTIONS;
  })
  const [funds, setFunds] = useState(() => {
    const saved = localStorage.getItem(`db_funds_${currentUser?.username}`);
    return saved ? JSON.parse(saved) : [];
  })
  
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem(`geminiApiKey_${currentUser?.username}`) || '')
  const [syncStatus, setSyncStatus] = useState('Chưa kết nối')
  const initialLoadDone = useRef(false)

  // Lưu vào LocalStorage & sync cloud (chỉ admin mới được ghi lên Drive)
  useEffect(() => {
    localStorage.setItem(`db_members_${currentUser?.username}`, JSON.stringify(members));
    localStorage.setItem(`db_plans_${currentUser?.username}`, JSON.stringify(plans));
    localStorage.setItem(`db_questions_${currentUser?.username}`, JSON.stringify(questions));
    localStorage.setItem(`db_funds_${currentUser?.username}`, JSON.stringify(funds));
    if (initialLoadDone.current && isAdmin) {
      uploadToCloud(members, plans, questions, funds);
    }
  }, [members, plans, questions, funds])

  useEffect(() => {
    downloadFromCloud();
  }, [])

  const downloadFromCloud = async () => {
    const config = getBranchConfig(currentUser?.username);
    if (!config.apiUrl) {
      setSyncStatus('Chưa cấu hình API URL');
      initialLoadDone.current = true;
      return;
    }
    setSyncStatus('Đang đồng bộ...');
    try {
      const res = await fetch(config.apiUrl);
      const dbData = await res.json();
      if (dbData.members) setMembers(dbData.members);
      if (dbData.plans) setPlans(dbData.plans);
      if (dbData.questions) setQuestions(dbData.questions);
      if (dbData.funds) setFunds(dbData.funds);
      setSyncStatus('Đã đồng bộ');
      initialLoadDone.current = true;
    } catch (error) {
      console.error("Lỗi đồng bộ:", error);
      setSyncStatus('Lỗi đồng bộ');
    }
  };

  const uploadToCloud = async (m, p, q, f) => {
    const config = getBranchConfig(currentUser?.username);
    if (!config.apiUrl) {
      setSyncStatus('Chưa cấu hình API URL');
      return;
    }
    setSyncStatus('Đang lưu lên Đám mây...');
    try {
      const dbContent = { members: m, plans: p, questions: q, funds: f };
      const res = await fetch(config.apiUrl, { 
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(dbContent)
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSyncStatus('Đã đồng bộ');
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Lỗi lưu lên Cloud:", error);
      setSyncStatus('Lỗi đồng bộ');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard members={members} />
      case 'members':
        return <MemberManager members={members} setMembers={setMembers} isAdmin={isAdmin} />
      case 'funds':
        return <FundManager funds={funds} setFunds={setFunds} isAdmin={isAdmin} />
      case 'attendance':
        return <AttendanceManager members={members} setMembers={setMembers} plans={plans} setPlans={setPlans} isAdmin={isAdmin} />
      case 'plans':
        return <PlansManager plans={plans} setPlans={setPlans} isAdmin={isAdmin} geminiApiKey={geminiApiKey} currentUser={currentUser} />
      case 'games':
        return isAdmin
          ? <GameManager questions={questions} setQuestions={setQuestions} geminiApiKey={geminiApiKey} onNeedSettings={() => setActiveTab('settings')} />
          : null
      case 'settings':
        return isAdmin
          ? <Settings 
              geminiApiKey={geminiApiKey} 
              setGeminiApiKey={(val) => {
                setGeminiApiKey(val);
                localStorage.setItem(`geminiApiKey_${currentUser?.username}`, val);
              }} 
              syncStatus={syncStatus} 
              currentUser={currentUser} 
            />
          : <div className="bg-white p-12 rounded-2xl text-center text-gray-400 text-lg">🔒 Chức năng này chỉ dành cho Admin.</div>
      case 'documents':
        return (
          <div className="space-y-6">
            <DocumentManager isAdmin={isAdmin} currentUser={currentUser} />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#f0f2f8' }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} onAppLogout={handleAppLogout} />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto animate-fade-in-up">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default function RootApp() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('app_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (account) => {
    setCurrentUser(account);
    localStorage.setItem('app_current_user', JSON.stringify(account));
  };

  const handleAppLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('app_current_user');
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/play" element={<PlayerMobile />} />
        <Route path="/" element={
          currentUser ? (
            <AppContent currentUser={currentUser} handleAppLogout={handleAppLogout} />
          ) : (
            <LoginScreen onLogin={handleLogin} />
          )
        } />
      </Routes>
    </BrowserRouter>
  )
}
