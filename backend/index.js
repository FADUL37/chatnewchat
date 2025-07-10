// index.js (backend)
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);  // ← ESTA LINHA ESTAVA FALTANDO!

const io = new Server(server, {
  cors: {
    origin: [
      'https://chatnewchat-999.onrender.com',      // URL correta do frontend
      'https://novochatchat-p67l.onrender.com',    // URL antiga (manter por compatibilidade)
      'http://localhost:3000'                      // desenvolvimento local
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true
  }
});
// ... existing code ...const users = new Set();

io.on('connection', (socket) => {
  console.log('✅ Usuário conectado:', socket.id);

  socket.on('set nickname', (nickname) => {
    socket.nickname = nickname;
    users.add(nickname);
    io.emit('user list', Array.from(users));
    io.emit('chat message', {
      type: 'info',
      text: `👋 ${nickname} entrou no chat!`
    });
  });

  socket.on('chat message', (message) => {
    // mensagem de texto
    io.emit('chat message', {
      type: 'chat',
      text: message,
      user: socket.nickname
    });
  });

  // ===== Handler de mídia (imagem, vídeo, áudio) =====
  socket.on('media message', (media) => {
    // media = { user, type, data (base64), fileName, fileType }
    io.emit('media message', media);
  });
  // ================================================

  socket.on('disconnect', () => {
    if (socket.nickname) {
      users.delete(socket.nickname);
      io.emit('user list', Array.from(users));
      io.emit('chat message', {
        type: 'info',
        text: `🚪 ${socket.nickname} saiu do chat.`
      });
    }
  });
});

app.get('/', (req, res) => {
  res.send('✅ Backend funcionando com Socket.IO!');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
