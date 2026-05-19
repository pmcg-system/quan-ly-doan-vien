import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

// Kết nối tới server: Ưu tiên biến môi trường (khi đưa lên mạng), nếu không thì dùng IP hiện tại (LAN)
const SERVER_URL = import.meta.env.VITE_GAME_SERVER_URL || (window.location.protocol + '//' + window.location.hostname + ':3000');

export default function PlayerMobile() {
  const [socket, setSocket] = useState(null);
  const [step, setStep] = useState('login'); // login, waiting, question, result, eliminated, ended
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [playerInfo, setPlayerInfo] = useState(null);
  
  // Game states
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [lastResult, setLastResult] = useState(null); // { isCorrect, isAlive, correctAnswer }
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    newSocket.on('joined_room', (player) => {
      setPlayerInfo(player);
      setStep('waiting');
    });

    newSocket.on('join_error', (msg) => {
      alert(msg);
    });

    newSocket.on('game_started', () => {
      setStep('waiting');
    });

    newSocket.on('new_question', (data) => {
      setSelectedAnswer(null);
      setLastResult(null);
      setCurrentQuestion(data.questionData);
      setTimeLeft(10); // local timer
      setStep('question');
    });

    newSocket.on('question_result', (result) => {
      setLastResult(result);
      if (result.isAlive) {
        setStep('result');
      } else {
        setStep('eliminated');
      }
    });

    newSocket.on('game_ended', (players) => {
      // Sắp xếp điểm
      const sorted = [...players].sort((a, b) => b.score - a.score);
      setLeaderboard(sorted);
      setStep('ended');
    });

    newSocket.on('room_closed', () => {
      alert('Phòng chơi đã đóng!');
      setStep('login');
      setPlayerInfo(null);
    });

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (step === 'question' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, step]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (pin && name && socket) {
      socket.emit('player_join', { pin, name });
    }
  };

  const handleAnswer = (answer) => {
    if (socket && !selectedAnswer) {
      setSelectedAnswer(answer);
      socket.emit('player_submit_answer', { pin, answer });
    }
  };

  // --- RENDERS ---

  if (step === 'login') {
    return (
      <div className="min-h-screen bg-blue-600 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">ĐTN</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Tham gia Trò chơi</h1>
          <form onSubmit={handleJoin} className="space-y-4">
            <input 
              type="text" 
              placeholder="Mã PIN Phòng" 
              value={pin} 
              onChange={e => setPin(e.target.value)} 
              className="w-full text-center text-2xl font-bold tracking-widest p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
              required 
            />
            <input 
              type="text" 
              placeholder="Nhập tên của bạn" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full text-center text-lg p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
              required 
            />
            <button type="submit" className="w-full py-4 bg-gray-900 text-white font-bold text-lg rounded-xl hover:bg-gray-800 transition-colors">
              Vào phòng
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'waiting') {
    return (
      <div className="min-h-screen bg-green-500 flex flex-col items-center justify-center p-6 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Bạn đã vào phòng!</h2>
        <p className="text-xl">Tên: {playerInfo?.name}</p>
        <p className="mt-8 text-lg animate-pulse">Đang chờ Quản trò bắt đầu câu hỏi...</p>
      </div>
    );
  }

  if (step === 'question') {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col p-4">
        <div className="text-center mb-4 mt-2">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold text-gray-800">Chọn Đáp án</h2>
            <div className={`text-2xl font-black w-12 h-12 rounded-full flex items-center justify-center ${timeLeft <= 3 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-200 text-gray-800'}`}>
              {timeLeft}
            </div>
          </div>
          {lastResult && lastResult.isAlive === false && (
            <p className="text-red-500 font-bold mb-2">Bạn đã bị loại, nhưng vẫn có thể đoán cho vui!</p>
          )}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-left text-lg font-bold text-gray-800 leading-snug">
            {currentQuestion?.question}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 flex-1 pb-4">
          {currentQuestion?.options.map(opt => {
            const letter = opt[0];
            let bgColor = "bg-gray-800";
            if (letter === 'A') bgColor = "bg-red-500";
            if (letter === 'B') bgColor = "bg-blue-500";
            if (letter === 'C') bgColor = "bg-yellow-500";
            if (letter === 'D') bgColor = "bg-green-500";

            return (
              <button 
                key={letter}
                onClick={() => handleAnswer(letter)}
                disabled={selectedAnswer !== null || timeLeft === 0}
                className={`${bgColor} ${selectedAnswer === letter ? 'ring-4 ring-gray-400 ring-offset-2 opacity-100 scale-[1.02]' : (selectedAnswer || timeLeft === 0 ? 'opacity-50' : '')} p-4 rounded-2xl shadow-md flex items-center text-white text-left font-semibold transition-all active:scale-95`}
              >
                <div className="text-3xl font-black w-12 shrink-0">{letter}</div>
                <div className="text-base leading-tight">{opt.substring(3)}</div>
              </button>
            );
          })}
        </div>
        {selectedAnswer && (
          <div className="text-center pb-2 font-bold text-gray-600">
            Đã chọn. Đang chờ kết quả...
          </div>
        )}
      </div>
    );
  }

  if (step === 'result' || step === 'eliminated') {
    const isCorrect = lastResult?.isCorrect;
    const isAlive = lastResult?.isAlive;

    let bgColor = isCorrect ? 'bg-green-500' : 'bg-red-500';
    let title = isCorrect ? 'Chính xác! +1 Điểm' : 'Sai rồi!';
    let sub = isCorrect ? 'Hãy chuẩn bị cho câu tiếp theo' : 'Bạn đã bị loại khỏi danh sách thi đấu!';

    if (!isAlive && step === 'eliminated') {
      bgColor = 'bg-gray-800';
      title = 'Đã bị loại';
      sub = isCorrect ? 'Bạn trả lời đúng, nhưng bạn đã bị loại từ trước rồi!' : 'Bạn trả lời sai!';
    }

    return (
      <div className={`min-h-screen ${bgColor} flex flex-col items-center justify-center p-6 text-white text-center`}>
        <div className="text-6xl mb-6">{isCorrect ? '🎉' : '❌'}</div>
        <h2 className="text-4xl font-bold mb-4">{title}</h2>
        <p className="text-xl mb-8">{sub}</p>
        <p className="text-lg bg-black/20 p-4 rounded-xl mb-6">Đáp án đúng là: <strong className="text-2xl block mt-2">{lastResult?.correctAnswer}</strong></p>
        
        {lastResult?.explanation && (
          <div className="bg-white/10 p-4 rounded-xl text-left border border-white/20">
            <h4 className="font-bold text-yellow-300 flex items-center gap-2 mb-2"><span className="text-xl">💡</span> Giải thích:</h4>
            <p className="text-sm leading-relaxed">{lastResult.explanation}</p>
          </div>
        )}

        <p className="mt-8 text-sm opacity-80 animate-pulse">Chờ câu hỏi tiếp theo...</p>
      </div>
    );
  }

  if (step === 'ended') {
    const myRank = leaderboard.findIndex(p => p.socketId === socket.id) + 1;
    const myData = leaderboard.find(p => p.socketId === socket.id);
    return (
      <div className="min-h-screen bg-purple-600 flex flex-col items-center justify-center p-6 text-white text-center">
        <h2 className="text-4xl font-bold mb-8">Tổng Kết</h2>
        <div className="bg-white/20 p-8 rounded-2xl w-full max-w-sm">
          <p className="text-2xl mb-2">Bạn Xếp Hạng</p>
          <div className="text-7xl font-black text-yellow-300 mb-4">#{myRank}</div>
          <p className="text-xl">Tổng điểm: {myData?.score}</p>
        </div>
        <button onClick={() => setStep('login')} className="mt-12 py-3 px-8 bg-white text-purple-600 font-bold rounded-full">Chơi lại</button>
      </div>
    );
  }

  return null;
}
