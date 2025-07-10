// App.js (frontend React)
// Ajuste da URL do backend para a de produção na Render

import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import OperatorBot from "./OperatorBot";
import { io } from "socket.io-client";

// DEFINIÇÃO CORRETA DA URL do servidor Socket.IO
const BACKEND_URL = "https://chatnewchat-2999.onrender.com";
const socket = io(BACKEND_URL);

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

  // Listeners únicos para não duplicar mensagens
  useEffect(() => {
    socket.off("chat message");
    socket.off("media message");
    socket.off("user list");

    socket.on("chat message", msg => {
      setMessages(prev => [...prev, msg]);
    });
    socket.on("media message", msg => {
      setMessages(prev => [...prev, msg]);
    });
    socket.on("user list", users => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off("chat message");
      socket.off("media message");
      socket.off("user list");
    };
  }, []);

  // Scroll automático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Envio de texto
  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit("chat message", input.trim());
    setInput("");
  };

  // Seleção de mídia
  const handleMediaSelect = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedMedia({
        user: nickname,
        type: file.type.split("/")[0],
        data: reader.result,
        fileName: file.name,
        fileType: file.type
      });
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  // Envio de mídia
  const sendSelectedMedia = () => {
    if (!selectedMedia) return;
    socket.emit("media message", selectedMedia);
    setSelectedMedia(null);
  };

  const deleteSelectedMedia = () => {
    setSelectedMedia(null);
  };

  // Gravação de áudio
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
          setAudioPreview({
            blob,
            url,
            user: nickname,
            type: "audio",
            fileName: "recording.webm",
            fileType: "audio/webm"
          });
          stream.getTracks().forEach(track => track.stop());
        };
        mr.start();
        setRecording(true);
      })
      .catch(err => {
        console.error("Microfone inacessível", err);
        alert("Erro ao acessar o microfone.");
      });
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") mr.stop();
    setRecording(false);
  };

  // Envio de áudio gravado
  const sendRecordedAudio = () => {
    if (!audioPreview) return;
    const reader = new FileReader();
    reader.onload = () => {
      const media = {
        user: audioPreview.user,
        type: audioPreview.type,
        data: reader.result,
        fileName: audioPreview.fileName,
        fileType: audioPreview.fileType
      };
      socket.emit("media message", media);
      URL.revokeObjectURL(audioPreview.url);
      setAudioPreview(null);
    };
    reader.readAsDataURL(audioPreview.blob);
  };

  const deleteRecordedAudio = () => {
    if (audioPreview) {
      URL.revokeObjectURL(audioPreview.url);
      setAudioPreview(null);
    }
  };

  // Tela de login
  if (!nicknameSet) {
    return (
      <div className={darkMode ? "App dark" : "App"}>
        <div className="mode-toggle-container">
          <button onClick={() => setDarkMode(m => !m)}>
            {darkMode ? "Modo Claro" : "Modo Escuro"}
          </button>
        </div>
        <div className="card">
          <h1>Digite seu apelido</h1>
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="Seu codinome"
          />
          <button
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
        <button onClick={() => setDarkMode(m => !m)}>
          {darkMode ? "Modo Claro" : "Modo Escuro"}
        </button>
      </div>
      <div className="card chat-card">
        <header className="chat-header">
          <h2>Olá, {nickname}</h2>
          <button onClick={() => { socket.disconnect(); window.location.reload(); }}>
            Sair
          </button>
        </header>
        <section className="messages">
          {messages.map((msg, i) => (
            <div key={i} className="message">
              {msg.type === "chat" && <p><strong>{msg.user}:</strong> {msg.text}</p>}
              {msg.type === "info" && <p className="info-message">{msg.text}</p>}
              {msg.type === "image" && (
                <img className="media-img" src={msg.data} alt={msg.fileName} />
              )}
              {msg.type === "video" && (
                <video className="media-video" controls src={msg.data} />
              )}
              {msg.type === "audio" && (
                <audio className="media-audio" controls src={msg.data} />
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </section>
        <footer className="input-row">
          <input
            type="text"
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
            <div className="media-preview">
              {selectedMedia.type === "image" ? (
                <img className="media-img" src={selectedMedia.data} alt="preview" />
              ) : (
                <video className="media-video" controls src={selectedMedia.data} />
              )}
              <button onClick={sendSelectedMedia}>Enviar Mídia</button>
              <button onClick={deleteSelectedMedia}>Excluir</button>
            </div>
          )}
          {!audioPreview && (
            <button onClick={recording ? stopRecording : startRecording}>
              {recording ? "Parar Gravação" : "Gravar Áudio"}
            </button>
          )}
          {audioPreview && (
            <div className="media-preview">
              <audio className="media-audio" controls src={audioPreview.url} />
              <button onClick={sendRecordedAudio}>Enviar Áudio</button>
              <button onClick={deleteRecordedAudio}>Excluir</button>
            </div>
          )}
        </footer>
      </div>
      <OperatorBot />
    </div>
  );
}

export default App;
