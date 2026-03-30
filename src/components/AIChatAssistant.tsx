import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

interface Message {
  id: string;
  sender: 'user' | 'ai';
  content: string;
}

export default function AIChatAssistant() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'ai', content: 'Hello! I am your global assistant. I can help you with information about the platform, rules, and if you are banned, explain why. I speak English and Chinese.' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', content: newMessage };
    setMessages(prev => [...prev, userMsg]);
    setNewMessage('');
    setIsTyping(true);

    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('AI service unavailable (API key missing)');
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      let context = `You are a helpful AI assistant for a coding platform called XiaoXuan. 
      You are expert in English and Chinese.
      User context: Username: ${user.username}, Role: ${user.role}.
      `;

      if (user.is_banned) {
        context += `IMPORTANT: This user is BANNED. Reason: "${user.ban_reason}". 
        Explain to them politely why they are banned based on this reason and advise them to contact admin via the support chat.`;
      } else {
        context += `The user is active and in good standing. Help them with coding questions or platform navigation.`;
      }

      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: context,
        },
        history: messages.map((m) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        })),
      });

      const result = await chat.sendMessage({ message: newMessage });
      
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'ai', content: result.text || "No response" }]);
    } catch (error: any) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'ai', content: 'Sorry, I encountered an error: ' + (error.message || 'Unknown error') }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 bg-purple-600 hover:bg-purple-500 text-white p-4 rounded-full shadow-lg z-40 transition-transform hover:scale-110"
      >
        <Bot className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 left-6 w-80 md:w-96 bg-neutral-900 border border-purple-500/30 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden h-[500px]"
          >
            {/* Header */}
            <div className="bg-neutral-800 p-4 flex justify-between items-center border-b border-white/5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="font-serif text-white">AI Assistant</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/20">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                      msg.sender === 'user'
                        ? 'bg-purple-600 text-white rounded-br-none'
                        : 'bg-neutral-800 text-neutral-200 rounded-bl-none border border-white/5'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-neutral-800 text-neutral-400 rounded-2xl rounded-bl-none px-4 py-2 text-xs border border-white/5">
                    Typing...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-neutral-800 border-t border-white/5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isTyping}
                  className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-xl transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
