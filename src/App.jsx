import { useState } from 'react'
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
  const [activeTab, setActiveTab] = useState('dashboard')
  const [accessToken, setAccessToken] = useState(null)
  const [members, setMembers] = useState(RAW_MEMBERS)
  const [plans, setPlans] = useState(INIT_PLANS)
  const [questions, setQuestions] = useState(INIT_QUESTIONS)
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('geminiApiKey') || '')

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
        return <Settings accessToken={accessToken} login={login} logout={logout} geminiApiKey={geminiApiKey} setGeminiApiKey={setGeminiApiKey} />
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
