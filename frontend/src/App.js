// App.js (frontend React) - Código completo atualizado
import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import OperatorBot from "./OperatorBot";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [nickname, setNickname] = useState("");
  const [nicknameSet, setNicknameSet] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);
  const [recording, setRecording] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]); // Lista de usuários online

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.on("chat message", (msg) => setMessages(prev => [...prev, msg]));
    socket.on("media message", (msg) => setMessages(prev => [...prev, msg]));
    socket.on("user list", (users) => setOnlineUsers(users)); // Escuta lista de usuários
    
    return () => {
      socket.off("chat message");
      socket.off("media message");
      socket.off("user list");
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Envio de mensagem de texto
  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit("chat message", input.trim());
    setInput("");
  };

  // Seleção de mídia (imagem/vídeo)
  const handleMediaSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedMedia({
        user: nickname,
        type: file.type.split("/")[0],
        data: reader.result,
        fileName: file.name,
        fileType: file.type,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  // Envio de mídia selecionada
  const sendSelectedMedia = () => {
    if (!selectedMedia) return;
    socket.emit("media message", selectedMedia);
    setSelectedMedia(null);
  };

  const deleteSelectedMedia = () => setSelectedMedia(null);

  // Iniciar gravação de áudio
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
          stream.getTracks().forEach(track => track.stop());
        };
        mr.start();
        setRecording(true);
      })
      .catch(err => {
        console.error("Microfone inacessível", err);
        alert("Erro ao acessar o microfone. Verifique as permissões.");
      });
  };

  // Parar gravação de áudio
  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      mr.stop();
    }
    setRecording(false);
  };

  // Enviar áudio gravado
  const sendRecordedAudio = () => {
    if (!audioPreview) return;
    const reader = new FileReader();
    reader.onload = () => {
      const media = {
        user: audioPreview.user,
        type: audioPreview.type,
        data: reader.result,
        fileName: audioPreview.fileName,
        fileType: audioPreview.fileType,
      };
      socket.emit("media message", media);
      URL.revokeObjectURL(audioPreview.url);
      setAudioPreview(null);
    };
    reader.readAsDataURL(audioPreview.blob);
  };

  // Deletar áudio gravado
  const deleteRecordedAudio = () => {
    if (audioPreview) {
      URL.revokeObjectURL(audioPreview.url);
      setAudioPreview(null);
    }
  };

  // Tela de entrada (definir nickname)
  if (!nicknameSet) {
    return (
      <div className={darkMode ? "App dark" : "App"}>
        <div className="mode-toggle-container">
          <button onClick={() => setDarkMode(d => !d)} className="mode-toggle-btn">
            {darkMode ? "Modo Claro" : "Modo Escuro"}
          </button>
        </div>
        <div className="card">
          <h1 className="neon-text">Digite seu apelido</h1>
          <input 
            className="neon-input" 
            type="text" 
            placeholder="Seu codinome" 
            value={nickname} 
            onChange={e => setNickname(e.target.value)}
            onKeyDown={e => e.key === "Enter" && nickname.trim() && (() => { socket.emit("set nickname", nickname.trim()); setNicknameSet(true); })()}
          />
          <button 
            className="neon-btn" 
            onClick={() => { 
              if (nickname.trim()) {
                socket.emit("set nickname", nickname.trim()); 
                setNicknameSet(true); 
              }
            }}
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  // Tela principal do chat
  return (
    <div className={darkMode ? "App dark" : "App"}>
      <div className="mode-toggle-container">
        <button onClick={() => setDarkMode(d => !d)} className="mode-toggle-btn">
          {darkMode ? "Modo Claro" : "Modo Escuro"}
        </button>
      </div>
      
      <div className="chat-container">
        {/* Painel lateral com usuários online */}
        <div className="users-panel">
          <div className="users-header">
            <h3 className="neon-text">👥 Online ({onlineUsers.length})</h3>
          </div>
          <div className="users-list">
            {onlineUsers.map((user, index) => (
              <div key={index} className={`user-item ${user === nickname ? 'current-user' : ''}`}>
                <span className="user-status">🟢</span>
                <span className="user-name">{user}</span>
                {user === nickname && <span className="you-label">(você)</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Chat principal */}
        <div className="card chat-card">
          <div className="chat-header">
            <h2 className="neon-text">Olá, {nickname}</h2>
            <button className="neon-btn small" onClick={() => { socket.disconnect(); window.location.reload(); }}>
              Sair
            </button>
          </div>
          <div className="messages">
            {messages.map((msg, i) => (
              <div key={i} className="message">
                <div className="message-header">
                  <strong className="neon-text">{msg.user}:</strong>
                  <span className="timestamp">{new Date().toLocaleTimeString()}</span>
                </div>
                <div className="message-content">
                  {msg.type === "chat" && <span>{msg.text}</span>}
                  {msg.type === "info" && <span className="info-message">{msg.text}</span>}
                  {msg.type === "image" && (
                    <div className="media-container">
                      <img className="media-img" src={msg.data} alt="Imagem" />
                    </div>
                  )}
                  {msg.type === "video" && (
                    <div className="media-container">
                      <video className="media-video" controls src={msg.data} />
                    </div>
                  )}
                  {msg.type === "audio" && (
                    <div className="media-container audio-container">
                      <div className="audio-player">
                        <span className="audio-icon">🎵</span>
                        <audio className="media-audio" controls src={msg.data} preload="metadata" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Preview de mídia selecionada */}
          {selectedMedia && (
            <div className="media-preview">
              <div className="preview-header">
                <span>Preview da mídia:</span>
              </div>
              <div className="preview-content">
                {selectedMedia.type === "image" ? (
                  <img className="media-img" src={selectedMedia.data} alt="preview" />
                ) : (
                  <video className="media-video" controls src={selectedMedia.data} />
                )}
              </div>
              <div className="preview-actions">
                <button className="neon-btn small" onClick={sendSelectedMedia}>Enviar Mídia</button>
                <button className="neon-btn small danger" onClick={deleteSelectedMedia}>Excluir</button>
              </div>
            </div>
          )}
          
          {/* Preview de áudio gravado */}
          {audioPreview && (
            <div className="media-preview audio-preview">
              <div className="preview-header">
                <span>🎤 Áudio gravado:</span>
              </div>
              <div className="preview-content">
                <div className="audio-player">
                  <span className="audio-icon">🎵</span>
                  <audio className="media-audio" controls src={audioPreview.url} preload="metadata" />
                </div>
              </div>
              <div className="preview-actions">
                <button className="neon-btn small" onClick={sendRecordedAudio}>Enviar Áudio</button>
                <button className="neon-btn small danger" onClick={deleteRecordedAudio}>Excluir</button>
              </div>
            </div>
          )}
          
          <div className="input-row">
            <input 
              className="neon-input flex" 
              type="text" 
              placeholder="Digite sua mensagem..." 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyDown={e => e.key === "Enter" && sendMessage()} 
            />
            <button className="neon-btn send-btn" onClick={sendMessage}>Enviar</button>
            
            {/* Botão de mídia */}
            {!selectedMedia && !audioPreview && (
              <label className="file-label neon-btn">
                📁
                <input 
                  type="file" 
                  accept="image/*,video/*" 
                  onChange={handleMediaSelect} 
                  hidden 
                />
              </label>
            )}
            
            {/* Botão de gravação de áudio */}
            {!audioPreview && !selectedMedia && (
              <button 
                className={`neon-btn record-btn ${recording ? 'recording' : ''}`}
                onClick={recording ? stopRecording : startRecording}
                disabled={selectedMedia !== null}
              >
                {recording ? "⏹️ Parar" : "🎤 Gravar"}
              </button>
            )}
          </div>
        </div>
      </div>
      <OperatorBot />
    </div>
  );
}

export default App;