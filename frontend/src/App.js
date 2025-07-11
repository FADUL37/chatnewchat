// src/App.js

import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import OperatorBot from "./OperatorBot";
import { io } from "socket.io-client";

// Usa apenas a URL de produção (ou variável REACT_APP_BACKEND_URL se definida)
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://chatnewchat-2999.onrender.com";
const socket = io(BACKEND_URL, {
  transports: ["websocket"],
  upgrade: false,
  forceNew: true
});

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [nickname, setNickname] = useState("");
  const [nicknameSet, setNicknameSet] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);
  const [recording, setRecording] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);

  // Inscribe / limpa listeners
  useEffect(() => {
    socket.on("chat message", msg => setMessages(prev => [...prev, msg]));
    socket.on("media message", msg => setMessages(prev => [...prev, msg]));
    socket.on("user list", users => setOnlineUsers(users));
    return () => {
      socket.off("chat message");
      socket.off("media message");
      socket.off("user list");
    };
  }, []);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit("chat message", input.trim());
    setInput("");
  };

  const handleMediaSelect = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSelectedMedia({
      user: nickname,
      type: file.type.split("/")[0],
      data: reader.result,
      fileName: file.name,
      fileType: file.type
    });
    reader.readAsDataURL(file);
    e.target.value = null;
  };
  const sendSelectedMedia = () => {
    if (selectedMedia) {
      socket.emit("media message", selectedMedia);
      setSelectedMedia(null);
    }
  };

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        audioChunksRef.current = [];
        const mr = new MediaRecorder(stream);
        mediaRecorderRef.current = mr;
        mr.ondataavailable = e => audioChunksRef.current.push(e.data);
        mr.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const url = URL.createObjectURL(blob);
          setAudioPreview({ blob, url, user: nickname, type: "audio", fileName: "recording.webm", fileType: "audio/webm" });
          stream.getTracks().forEach(t => t.stop());
        };
        mr.start();
        setRecording(true);
      })
      .catch(() => alert("Erro ao acessar o microfone."));
  };
  const stopRecording = () => { mediaRecorderRef.current?.stop(); setRecording(false); };
  const sendRecordedAudio = () => {
    if (!audioPreview) return;
    const reader = new FileReader();
    reader.onload = () => {
      socket.emit("media message", {
        user: audioPreview.user,
        type: audioPreview.type,
        data: reader.result,
        fileName: audioPreview.fileName,
        fileType: audioPreview.fileType
      });
      URL.revokeObjectURL(audioPreview.url);
      setAudioPreview(null);
    };
    reader.readAsDataURL(audioPreview.blob);
  };

  // Tela de apelido
  if (!nicknameSet) {
    return (
      <div className={darkMode ? "App dark" : "App"}>
        <button className="mode-toggle" onClick={() => setDarkMode(m => !m)}>
          {darkMode ? "Modo Claro" : "Modo Escuro"}
        </button>
        <div className="login-card">
          <h1>Digite seu apelido</h1>
          <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Seu apelido" />
          <button onClick={() => {
            if (nickname.trim()) {
              socket.emit("set nickname", nickname.trim());
              setNicknameSet(true);
            }
          }}>Entrar</button>
        </div>
      </div>
    );
  }

  // Chat principal
  return (
    <div className={darkMode ? "App dark" : "App"}>
      <button className="mode-toggle" onClick={() => setDarkMode(m => !m)}>
        {darkMode ? "Modo Claro" : "Modo Escuro"}
      </button>
      <div className="chat-container">
        <header>
          <h2>Olá, {nickname}</h2>
          <button onClick={() => { socket.disconnect(); window.location.reload(); }}>Sair</button>
        </header>
        <section className="messages">
          {messages.map((msg, i) => (
            <div key={i} className={msg.type === "info" ? "info" : "message"}>
              {msg.type === "chat" && <p><strong>{msg.user}:</strong> {msg.text}</p>}
              {msg.type === "info" && <p className="info">{msg.text}</p>}
              {msg.type === "image" && <img src={msg.data} alt={msg.fileName} />}
              {msg.type === "video" && <video controls src={msg.data} />}
              {msg.type === "audio" && <audio controls src={msg.data} />}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </section>
        <footer>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="Digite sua mensagem..."
          />
          <button onClick={sendMessage}>Enviar</button>
          <label className="file-label">
            📁<input type="file" accept="image/*,video/*" onChange={handleMediaSelect} hidden />
          </label>
          {selectedMedia && (
            <div className="preview">
              {selectedMedia.type === "image"
                ? <img src={selectedMedia.data} alt="preview" />
                : <video controls src={selectedMedia.data} />}
              <button onClick={sendSelectedMedia}>Enviar</button>
            </div>
          )}
          {!audioPreview && (
            <button onClick={recording ? stopRecording : startRecording}>
              {recording ? "Parar Gravação" : "Gravar Áudio"}
            </button>
          )}
          {audioPreview && (
            <div className="preview">
              <audio controls src={audioPreview.url} />
              <button onClick={sendRecordedAudio}>Enviar</button>
            </div>
          )}
        </footer>
      </div>
      <OperatorBot />
    </div>
  );
}

export default App;
