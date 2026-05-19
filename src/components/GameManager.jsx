import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Btn, SectionDivider } from './UI';
import { Settings as SettingsIcon, Plus, Trash2, Edit, Sparkles, Loader2 } from 'lucide-react';

const SERVER_URL = import.meta.env.VITE_GAME_SERVER_URL || (window.location.protocol + '//' + window.location.hostname + ':3000');

export default function GameManager({ questions, setQuestions, geminiApiKey, onNeedSettings }) {
  const [socket, setSocket] = useState(null);
  const [pin, setPin] = useState(null);
  const [players, setPlayers] = useState([]);
  
  const [step, setStep] = useState('menu'); // menu, lobby, question, revealed, leaderboard, manage_questions
  const [qIndex, setQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  
  // States for Question Management
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    newSocket.on('room_created', (newPin) => {
      setPin(newPin);
      setStep('lobby');
    });

    newSocket.on('players_update', (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    return () => newSocket.close();
  }, []);

  // Timer logic
  useEffect(() => {
    if (timeLeft > 0 && step === 'question') {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && step === 'question') {
      handleReveal();
    }
  }, [timeLeft, step]);

  const handleCreateRoom = () => {
    socket.emit('host_create_room');
  };

  const handleStartGame = () => {
    if (players.length === 0) {
      if (!window.confirm("Chưa có ai vào phòng. Vẫn bắt đầu?")) return;
    }
    if (questions.length === 0) {
      alert("Chưa có câu hỏi nào trong bộ câu hỏi!");
      return;
    }
    socket.emit('host_start_game', pin);
    setQIndex(0);
    showQuestion(0);
  };

  const handleGenerateAI = async () => {
    if (!geminiApiKey) {
      alert("Vui lòng nhập Gemini API Key trong phần Cài đặt trước khi sử dụng tính năng này!");
      onNeedSettings();
      return;
    }
    if (!aiTopic.trim()) return alert("Vui lòng nhập chủ đề sinh hoạt!");
    
    setIsGenerating(true);
    
    try {
      // 1. Lấy danh sách các model mà API Key này được phép sử dụng
      const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`);
      const modelsData = await modelsRes.json();
      
      if (modelsData.error) {
        throw new Error("Lỗi API Key: " + modelsData.error.message);
      }

      const availableModels = modelsData.models || [];
      // Sắp xếp model: ưu tiên flash -> pro -> các model khác
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
        throw new Error("Tài khoản (API Key) của bạn không được cấp quyền sử dụng bất kỳ AI nào hỗ trợ tạo văn bản.");
      }

      let lastError = null;
      let newQuestions = null;

      // 2. Thử lần lượt các model cho đến khi thành công
      for (const targetModel of supportedModels) {
        try {
          const prompt = `Bạn là một chuyên gia tạo câu hỏi trắc nghiệm. Hãy tạo 10 câu hỏi trắc nghiệm bằng tiếng Việt về chủ đề: '${aiTopic}'.\n\nQUAN TRỌNG: Chỉ trả về MỘT MẢNG JSON, tuyệt đối không bọc trong markdown hay giải thích thêm. Định dạng mỗi phần tử:\n{"question": "Nội dung câu hỏi?", "options": ["A. Đáp án 1", "B. Đáp án 2", "C. Đáp án 3", "D. Đáp án 4"], "correct": "A", "explanation": "Giải thích ngắn gọn."}`;
          
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          });
          
          const data = await response.json();
          if (data.error) throw new Error(data.error.message);
          
          let jsonText = data.candidates[0].content.parts[0].text.trim();
          if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '');
          }
          
          const parsed = JSON.parse(jsonText);
          if (!Array.isArray(parsed)) throw new Error("Kết quả AI trả về không đúng định dạng JSON.");
          
          newQuestions = parsed.map((q, idx) => ({
            id: Date.now() + idx,
            question: q.question || "Lỗi đọc câu hỏi",
            options: q.options || ["A. ", "B. ", "C. ", "D. "],
            correct: q.correct || "A",
            explanation: q.explanation || ""
          }));
          
          break; // Thành công thì thoát vòng lặp
        } catch (err) {
          console.warn(`Model ${targetModel} thất bại:`, err.message);
          lastError = err;
        }
      }

      if (newQuestions) {
        setQuestions(newQuestions);
        setAiTopic('');
        alert("🎉 Đã tạo thành công bộ câu hỏi tự động mới!");
      } else {
        // Phân tích lỗi nếu tất cả đều thất bại
        if (lastError?.message?.includes("quota") || lastError?.message?.includes("limit: 0")) {
          alert("Lỗi: Tài khoản Google của bạn không hỗ trợ gói miễn phí (Free Tier) cho AI tại khu vực hiện tại, hoặc bạn đã dùng hết lượt. Vui lòng bật thanh toán (Billing) hoặc dùng mạng VPN để đổi quốc gia.");
        } else {
          alert("Lỗi khi tạo câu hỏi (Đã thử tất cả AI): " + lastError?.message);
        }
      }

    } catch (err) {
      console.error(err);
      alert("Lỗi hệ thống: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const showQuestion = (index) => {
    if (index >= questions.length) {
      handleEndGame();
      return;
    }
    setStep('question');
    setTimeLeft(10); // 10 seconds per question
    socket.emit('host_show_question', { 
      pin, 
      questionIndex: index, 
      correctAnswer: questions[index].correct,
      questionData: questions[index]
    });
  };

  const handleReveal = () => {
    setStep('revealed');
    socket.emit('host_reveal_answer', pin);
  };

  const handleNextQuestion = () => {
    const nextIdx = qIndex + 1;
    setQIndex(nextIdx);
    showQuestion(nextIdx);
  };

  const handleEndGame = () => {
    setStep('leaderboard');
    socket.emit('host_end_game', pin);
  };

  // --- RENDERS ---

  if (step === 'menu') {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 style={{ margin: 0, fontSize: 22, color: "#1a1a2e" }}>🎮 Trò chơi: Hỏi nhanh đáp gọn</h2>
          <button 
            onClick={() => setStep('manage_questions')}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 shadow-sm transition-all"
          >
            <SettingsIcon size={18} /> Quản lý Câu hỏi ({questions.length})
          </button>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-lg text-center mx-auto mt-12">
          <div className="text-6xl mb-6">🏆</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Rung chuông vàng</h3>
          <p className="text-gray-500 mb-8 text-sm">Tạo phòng chơi mới. Các đoàn viên sẽ dùng điện thoại truy cập vào địa chỉ IP của máy tính để trả lời câu hỏi.</p>
          <button 
            onClick={handleCreateRoom}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            Tạo Phòng Ngay
          </button>
        </div>
      </div>
    );
  }

  if (step === 'lobby') {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 style={{ margin: 0, fontSize: 22, color: "#1a1a2e" }}>🎮 Đang chờ người chơi...</h2>
          <Btn onClick={handleStartGame}>Bắt đầu chơi ({players.length})</Btn>
        </div>
        
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
          <p className="text-gray-500 mb-2">Hướng dẫn người chơi dùng điện thoại truy cập vào:</p>
          <div className="text-3xl font-bold text-blue-600 mb-4">{window.location.hostname}:5173/play</div>
          <p className="text-gray-500 mb-2">Và nhập mã PIN:</p>
          <div className="text-7xl font-black tracking-widest text-gray-900 bg-gray-100 py-6 rounded-2xl inline-block px-12 mb-8">
            {pin}
          </div>
          
          <SectionDivider label={`Đã tham gia: ${players.length}`} />
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            {players.length === 0 && <div className="text-gray-400 italic">Chưa có ai...</div>}
            {players.map(p => (
              <span key={p.socketId} className="px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-lg border border-blue-100">
                {p.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'question' || step === 'revealed') {
    const q = questions[qIndex];
    const answersSubmitted = players.filter(p => p.currentAnswer !== null).length;
    const alivePlayers = players.filter(p => p.alive).length;

    return (
      <div className="flex flex-col h-[80vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Câu hỏi {qIndex + 1}/{questions.length}</h2>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-sm text-gray-500">Đã trả lời</div>
              <div className="text-xl font-bold text-blue-600">{answersSubmitted} / {alivePlayers}</div>
            </div>
            {step === 'question' ? (
              <div className={`text-4xl font-black w-16 h-16 rounded-full flex items-center justify-center ${timeLeft <= 3 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-800'}`}>
                {timeLeft}
              </div>
            ) : (
              <Btn onClick={handleNextQuestion}>Câu tiếp theo ➡</Btn>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-6 flex items-center justify-center text-center shrink-0">
          <h1 className="text-3xl font-bold text-gray-800 leading-tight">{q.question}</h1>
        </div>

        <div className="grid grid-cols-2 gap-4 flex-1">
          {q.options.map((opt) => {
            const letter = opt[0];
            let bgColor = "bg-gray-800";
            let opacity = "opacity-100";
            
            if (letter === 'A') bgColor = "bg-red-500";
            if (letter === 'B') bgColor = "bg-blue-500";
            if (letter === 'C') bgColor = "bg-yellow-500";
            if (letter === 'D') bgColor = "bg-green-500";

            if (step === 'revealed') {
              if (letter === q.correct) {
                opacity = "opacity-100 ring-8 ring-green-300 ring-inset";
                bgColor = "bg-green-500"; 
              } else {
                opacity = "opacity-30";
              }
            }

            return (
              <div key={opt} className={`${bgColor} ${opacity} text-white p-6 rounded-2xl shadow-md flex items-center gap-4 text-xl font-bold transition-all`}>
                <span className="text-4xl font-black">{letter}</span>
                <span className="leading-snug font-semibold">{opt.substring(3)}</span>
              </div>
            );
          })}
        </div>

        {step === 'revealed' && q.explanation && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 p-6 rounded-2xl shadow-sm">
            <h4 className="text-lg font-bold text-yellow-800 flex items-center gap-2 mb-2">
              <span className="text-2xl">💡</span> Giải thích:
            </h4>
            <p className="text-yellow-900 leading-relaxed text-lg">{q.explanation}</p>
          </div>
        )}
      </div>
    );
  }

  if (step === 'leaderboard') {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    return (
      <div>
        <h2 style={{ margin: 0, fontSize: 22, color: "#1a1a2e", marginBottom: 20 }}>🏆 Bảng xếp hạng chung cuộc</h2>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
          {sorted.map((p, idx) => (
            <div key={p.socketId} className={`flex justify-between items-center p-4 border-b ${idx === 0 ? 'bg-yellow-50 border-yellow-200 rounded-xl' : 'border-gray-100'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${idx === 0 ? 'bg-yellow-400 text-white text-xl' : 'bg-gray-100 text-gray-500'}`}>
                  {idx + 1}
                </div>
                <span className={`text-lg font-bold ${idx === 0 ? 'text-yellow-700' : 'text-gray-800'}`}>{p.name}</span>
                {!p.alive && <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full font-bold">Bị loại</span>}
              </div>
              <div className="text-xl font-black text-gray-800">{p.score} <span className="text-sm font-normal text-gray-500">điểm</span></div>
            </div>
          ))}
          <div className="mt-8 text-center">
            <button onClick={() => { setStep('menu'); socket.emit('host_create_room'); }} className="py-3 px-8 bg-gray-100 text-gray-800 font-bold rounded-xl hover:bg-gray-200">
              Trở về Lobby
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'manage_questions') {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><SettingsIcon /> Quản lý Bộ câu hỏi</h2>
          <div className="flex gap-4">
            <button onClick={() => setStep('menu')} className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200">
              Trở về
            </button>
          </div>
        </div>

        {/* AI Generator Box */}
        <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
          <h3 className="text-lg font-bold text-purple-800 flex items-center gap-2 mb-2"><Sparkles size={20}/> Tự động soạn câu hỏi bằng AI</h3>
          <p className="text-purple-600 text-sm mb-4">Nhập chủ đề sinh hoạt và AI sẽ tự động tạo 10 câu hỏi có kèm đáp án và lời giải thích.</p>
          <div className="flex gap-4">
            <input 
              type="text" 
              placeholder="Ví dụ: Lịch sử Đoàn thanh niên, Kỹ năng thanh niên..." 
              value={aiTopic}
              onChange={e => setAiTopic(e.target.value)}
              className="flex-1 p-3 border border-purple-200 rounded-xl outline-none focus:border-purple-500"
              disabled={isGenerating}
              onKeyDown={e => e.key === 'Enter' && handleGenerateAI()}
            />
            <button 
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
              {isGenerating ? 'Đang tạo...' : 'Tạo 10 câu hỏi'}
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4 border-b pb-4">
          <div className="font-bold text-gray-700 text-lg">Danh sách câu hỏi hiện tại ({questions.length})</div>
          <Btn onClick={() => setEditingQuestion({ id: Date.now(), question: '', options: ['A. ', 'B. ', 'C. ', 'D. '], correct: 'A', explanation: '' })}>
            <Plus size={18} /> Thêm Câu hỏi
          </Btn>
        </div>

        {editingQuestion && (
          <div className="mb-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
            <h3 className="text-lg font-bold text-blue-800 mb-4">{editingQuestion.id === Date.now() ? 'Thêm mới' : 'Chỉnh sửa'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nội dung câu hỏi</label>
                <textarea 
                  value={editingQuestion.question} 
                  onChange={e => setEditingQuestion({...editingQuestion, question: e.target.value})}
                  className="w-full p-3 border rounded-lg" rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[0, 1, 2, 3].map(i => (
                  <div key={i}>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Đáp án {['A', 'B', 'C', 'D'][i]}</label>
                    <input 
                      type="text" 
                      value={editingQuestion.options[i]} 
                      onChange={e => {
                        const newOpts = [...editingQuestion.options];
                        newOpts[i] = e.target.value;
                        setEditingQuestion({...editingQuestion, options: newOpts});
                      }}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Đáp án đúng</label>
                  <select 
                    value={editingQuestion.correct} 
                    onChange={e => setEditingQuestion({...editingQuestion, correct: e.target.value})}
                    className="w-full p-2 border rounded-lg font-bold"
                  >
                    <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Giải thích (Tùy chọn)</label>
                  <textarea 
                    value={editingQuestion.explanation} 
                    onChange={e => setEditingQuestion({...editingQuestion, explanation: e.target.value})}
                    className="w-full p-2 border rounded-lg" rows={2}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setEditingQuestion(null)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold">Hủy</button>
                <button 
                  onClick={() => {
                    if (questions.find(q => q.id === editingQuestion.id)) {
                      setQuestions(questions.map(q => q.id === editingQuestion.id ? editingQuestion : q));
                    } else {
                      setQuestions([...questions, editingQuestion]);
                    }
                    setEditingQuestion(null);
                  }} 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                >Lưu câu hỏi</button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div key={q.id} className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="font-bold text-gray-800 text-lg mb-2">Câu {idx + 1}: {q.question}</div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    {q.options.map(opt => (
                      <div key={opt} className={`${opt[0] === q.correct ? 'font-bold text-green-600' : ''}`}>
                        {opt} {opt[0] === q.correct && '✅'}
                      </div>
                    ))}
                  </div>
                  {q.explanation && <div className="mt-2 text-sm text-yellow-700 bg-yellow-50 p-2 rounded">💡 {q.explanation}</div>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingQuestion(q)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit size={18} /></button>
                  <button onClick={() => setQuestions(questions.filter(x => x.id !== q.id))} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
