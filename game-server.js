import express from 'react'; // Just to prevent syntax error if not using module, wait, we are using ES modules?
// Wait, package.json says "type": "module". So we use ES imports.
import expressApp from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = expressApp();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Lưu trữ trạng thái các phòng chơi
const rooms = {};

// Helper: Generate random 4-digit PIN
const generatePIN = () => Math.floor(1000 + Math.random() * 9000).toString();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // --- HOST EVENTS ---

  socket.on('host_create_room', () => {
    const pin = generatePIN();
    rooms[pin] = {
      hostId: socket.id,
      players: [],
      gameState: 'lobby', // lobby, question, revealed, leaderboard
      currentQuestionIndex: -1,
      correctAnswer: null
    };
    socket.join(pin);
    socket.emit('room_created', pin);
    console.log(`Room ${pin} created by ${socket.id}`);
  });

  socket.on('host_start_game', (pin) => {
    if (rooms[pin] && rooms[pin].hostId === socket.id) {
      rooms[pin].gameState = 'playing';
      io.to(pin).emit('game_started');
    }
  });

  socket.on('host_show_question', ({ pin, questionIndex, correctAnswer, questionData }) => {
    if (rooms[pin] && rooms[pin].hostId === socket.id) {
      rooms[pin].gameState = 'question';
      rooms[pin].currentQuestionIndex = questionIndex;
      rooms[pin].correctAnswer = correctAnswer;
      rooms[pin].explanation = questionData.explanation; // LƯU GIẢI THÍCH
      
      // Reset currentAnswer cho tất cả player
      rooms[pin].players.forEach(p => p.currentAnswer = null);
      
      io.to(pin).emit('new_question', { questionIndex, questionData });
      io.to(rooms[pin].hostId).emit('players_update', rooms[pin].players); // update host
    }
  });

  socket.on('host_reveal_answer', (pin) => {
    if (rooms[pin] && rooms[pin].hostId === socket.id) {
      rooms[pin].gameState = 'revealed';
      const correctOpt = rooms[pin].correctAnswer;

      // Tính điểm
      rooms[pin].players.forEach(p => {
        if (p.alive) {
          if (p.currentAnswer === correctOpt) {
            p.score += 1;
          } else {
            p.alive = false; // Loại!
          }
        }
      });

      // Gửi kết quả cho từng người chơi
      rooms[pin].players.forEach(p => {
        const isCorrect = p.currentAnswer === correctOpt;
        io.to(p.socketId).emit('question_result', {
          isCorrect,
          isAlive: p.alive,
          correctAnswer: correctOpt,
          explanation: rooms[pin].explanation
        });
      });

      // Cập nhật cho Host
      io.to(rooms[pin].hostId).emit('players_update', rooms[pin].players);
    }
  });

  socket.on('host_end_game', (pin) => {
    if (rooms[pin] && rooms[pin].hostId === socket.id) {
      rooms[pin].gameState = 'leaderboard';
      io.to(pin).emit('game_ended', rooms[pin].players);
    }
  });

  // --- PLAYER EVENTS ---

  socket.on('player_join', ({ pin, name }) => {
    const room = rooms[pin];
    if (room && room.gameState === 'lobby') {
      const player = {
        socketId: socket.id,
        name: name,
        score: 0,
        alive: true,
        currentAnswer: null
      };
      room.players.push(player);
      socket.join(pin);
      
      socket.emit('joined_room', player);
      io.to(room.hostId).emit('players_update', room.players);
      console.log(`${name} joined room ${pin}`);
    } else {
      socket.emit('join_error', 'Phòng không tồn tại hoặc đã bắt đầu chơi!');
    }
  });

  socket.on('player_submit_answer', ({ pin, answer }) => {
    const room = rooms[pin];
    if (room && room.gameState === 'question') {
      const player = room.players.find(p => p.socketId === socket.id);
      if (player) {
        player.currentAnswer = answer;
        // Báo cho Host biết có người vừa trả lời (để hiện số lượng)
        io.to(room.hostId).emit('players_update', room.players);
      }
    }
  });

  socket.on('disconnect', () => {
    // Tìm và xóa người chơi khỏi phòng nếu disconnect
    for (const pin in rooms) {
      const room = rooms[pin];
      if (room.hostId === socket.id) {
        // Host thoát -> Giải tán phòng
        io.to(pin).emit('room_closed');
        delete rooms[pin];
      } else {
        const pIndex = room.players.findIndex(p => p.socketId === socket.id);
        if (pIndex !== -1) {
          room.players.splice(pIndex, 1);
          io.to(room.hostId).emit('players_update', room.players);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Game Server running on port ${PORT}`);
});
