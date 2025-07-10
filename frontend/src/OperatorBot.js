// src/OperatorBot.js
import React, { useState, useRef, useEffect } from "react";
import { BotIcon } from "lucide-react";
import { operadorasData } from "./operadorasData.js";

/**
 * Chatbot humanizado para suporte completo de operadoras
 */
export default function OperatorBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]);
  const messagesEndRef = useRef(null);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // Função para limpar o chat
  const clearChat = () => {
    setChat([]);
  };

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    const lower = text.toLowerCase();
    let reply = null;

    // Saudações
    if (/\b(oi|olá|ola)\b/.test(lower)) {
      reply = "Olá! 😊 Em que posso ajudar você hoje?";
    } else if (lower.includes("bom dia")) {
      reply = "Bom dia! ☀️ Como está sua conexão?";
    } else if (lower.includes("boa tarde")) {
      reply = "Boa tarde! 🌤️ Em qual serviço posso ajudar?";
    } else if (lower.includes("boa noite")) {
      reply = "Boa noite! 🌙 Algo mais antes de encerrar?";
    }

    // Diagnóstico de conexão genérico
    if (!reply && (lower.includes("sem conexão") || lower.includes("sem conexao") || lower.includes("conexão") || lower.includes("conexao") || lower.includes("offline") || lower.includes("off-line") || lower.includes("conexao"))) {
      reply =
        "Vamos verificar sua conexão:\n" +
        "1️⃣ Verifique cabos de rede ou fibra óptica.\n" +
        "2️⃣ Reinicie seu modem/roteador (desligue por 30s).\n" +
        "3️⃣ Se usar Wi-Fi, aproxime-se do roteador.\n" +
        "4️⃣ Execute um teste de velocidade para confirmar.";
    }

    // Internet lenta ou lentidão genérica
    if (!reply && (lower.includes("internet lenta") || lower.includes("internet lento") || lower.includes("lentidão") || lower.includes("lentidao") || lower.includes("lenteza") || lower.includes("lento") || lower.includes("lenta"))) {
      reply =
        "Sua internet pode estar lenta por:\n" +
        "• Uso simultâneo de muitos dispositivos.\n" +
        "• Distância ou obstáculos entre dispositivo e roteador.\n" +
        "• Interferências de outros eletrônicos.\n" +
        "Sugestões:\n" +
        "1️⃣ Feche apps que consomem banda.\n" +
        "2️⃣ Faça um speedtest (speedtest.net) e compartilhe o resultado.\n" +
        "3️⃣ Reinicie o roteador e teste novamente.";
    }

    // Wi-Fi genérico
    if (!reply && (lower.includes("wi-fi") || lower.includes("wifi"))) {
      reply =
        "Para melhorar seu Wi-Fi:\n" +
        "• Posicione o roteador em local central e elevado.\n" +
        "• Use canais menos congestionados.\n" +
        "• Evite proximidade com micro-ondas e aparelhos Bluetooth.";
    }

    // Teste de velocidade
    if (!reply && lower.includes("teste de velocidade")) {
      reply =
        "Você pode medir sua velocidade em speedtest.net ou fast.com.\n" +
        "Por favor, me informe ping, download e upload para analisarmos.";
    }

    // Problemas de TV
    if (!reply && lower.includes("tv")) {
      reply =
        "Problemas com TV? Tente:\n" +
        "1️⃣ Verificar cabos HDMI/RCA no receptor e na TV.\n" +
        "2️⃣ Reiniciar set-top box e TV.\n" +
        "3️⃣ Confirmar assinatura ativa na central da operadora.";
    }

    // Limpeza de cache e DNS
    if (!reply && lower.includes("limpeza") && lower.includes("cache")) {
      reply =
        "Para limpar cache DNS e renovar IP:\n" +
        "Windows: 'ipconfig /flushdns' e 'ipconfig /renew' no CMD.\n" +
        "Mac/Linux: 'sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder'.";
    }

    // Consulta de operadora
    if (!reply) {
      const key = Object.keys(operadorasData).find((k) =>
        lower.includes(k.replace(/_/g, " ").toLowerCase())
      );
      if (key) {
        const data = operadorasData[key];
        const suporteList = data.suporte ? data.suporte.join(', ') : 'Não disponível';
        reply =
          `**${data.nome}**\n` +
          `Tecnologias: ${data.tecnologias}\n` +
          `Planos: ${data.planos}\n` +
          `Suporte: ${suporteList}`;
      }
    }

    // Fallback inteligente
    if (!reply) {
      reply =
        "Desculpe, não entendi.\n" +
        "Você pode descrever se é conexão, Wi-Fi, lentidão, TV ou mencionar a operadora?";
    }

    setChat((prev) => [...prev, { user: text, bot: reply }]);
    setInput("");
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
        <button
          onClick={() => setOpen((o) => !o)}
          className="p-3 rounded-full bg-gradient-to-br from-green-400 to-blue-500 text-white shadow-lg hover:scale-110 transition-transform"
          aria-label="Abrir Chatbot"
        >
          <BotIcon className="w-7 h-7" />
        </button>

        {open && (
          <div className="mt-2 w-80 sm:w-96">
            <div className="flex flex-col h-[520px] bg-white rounded-lg shadow-xl overflow-hidden">
              {/* Header com botão de limpar */}
              <div className="bg-gradient-to-r from-green-400 to-blue-500 p-4 text-white text-center font-bold flex justify-between items-center">
                <span>Chat de Suporte Humano 🤖</span>
                <button
                  onClick={clearChat}
                  className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                  title="Limpar conversa"
                >
                  🗑️
                </button>
              </div>
              
              {/* Área de mensagens com barra de rolagem INDEPENDENTE */}
              <div 
                className="flex-1 p-3 space-y-3 bg-gray-50 text-sm bot-chat-scroll"
                style={{
                  maxHeight: '400px',
                  overflowY: 'auto',
                  overflowX: 'hidden'
                }}
              >
                {chat.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <div className="text-4xl mb-2">🤖</div>
                    <p>Olá! Como posso ajudar você hoje?</p>
                    <p className="text-xs mt-2">Digite sua dúvida sobre internet, TV ou operadoras</p>
                  </div>
                ) : (
                  chat.map((msg, idx) => (
                    <div key={idx} className="animate-fadeIn">
                      <div className="text-right text-green-600 font-medium mb-1">
                        Você: {msg.user}
                      </div>
                      <div className="mt-1 p-3 bg-white rounded-lg shadow-sm border-l-4 border-green-400 whitespace-pre-wrap operator-info-scroll">
                        {msg.bot}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Input area */}
              <div className="p-3 border-t flex gap-2 bg-white">
                <input
                  type="text"
                  placeholder="Digite sua mensagem..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 transition-colors"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Estilos CSS customizados com classes ESPECÍFICAS */}
      <style jsx global>{`
        /* Barra de rolagem ESPECÍFICA para o chat do bot */
        .bot-chat-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .bot-chat-scroll::-webkit-scrollbar-track {
          background: #F3F4F6;
          border-radius: 4px;
        }
        .bot-chat-scroll::-webkit-scrollbar-thumb {
          background: #10B981;
          border-radius: 4px;
        }
        .bot-chat-scroll::-webkit-scrollbar-thumb:hover {
          background: #059669;
        }
        
        /* Barra de rolagem ESPECÍFICA para informações das operadoras */
        .operator-info-scroll {
          max-height: 200px;
          overflow-y: auto;
          overflow-x: hidden;
        }
        .operator-info-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .operator-info-scroll::-webkit-scrollbar-track {
          background: #E5E7EB;
          border-radius: 3px;
        }
        .operator-info-scroll::-webkit-scrollbar-thumb {
          background: #6B7280;
          border-radius: 3px;
        }
        .operator-info-scroll::-webkit-scrollbar-thumb:hover {
          background: #4B5563;
        }
        
        /* Animação de entrada */
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Para Firefox */
        .bot-chat-scroll {
          scrollbar-width: thin;
          scrollbar-color: #10B981 #F3F4F6;
        }
        .operator-info-scroll {
          scrollbar-width: thin;
          scrollbar-color: #6B7280 #E5E7EB;
        }
      `}</style>
    </>
  );
}