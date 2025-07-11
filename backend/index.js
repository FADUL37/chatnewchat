// index.js (backend)
// Configura Express, CORS e Socket.IO para aceitar conexões do seu front em
// https://chatnewchat-999.onrender.com, do localhost e do seu domínio de produção.
// :contentReference[oaicite:0]{index=0}

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
// CORS global para rotas HTTP
app.use(cors({
  origin: [
    'https://chatnewchat-999.onrender.com',  // frontend em produção
      ],
  credentials: true
}));

const server = http.createServer(app);

// Instância do Socket.IO com CORS específico
const io = new Server(server, {
  cors: {
    origin: [
      'https://chatnewchat-999.onrender.com',
      'https://novochatchat-p67l.onrender.com', // manter legado se quiser
      'https://chatnewchat-2999.onrender.com', // domínio do back em produção
      'http://localhost:3000'
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true
  }
});

const users = new Set();

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
    io.emit('chat message', {
      type: 'chat',
      text: message,
      user: socket.nickname
    });
  });

  socket.on('media message', (media) => {
    io.emit('media message', media);
  });

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
