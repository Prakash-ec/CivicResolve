import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  Languages,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { aiCivicService } from '../../services/api.js';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AICivicAssistantModalProps {
  complaintContext?: {
    publicId?: string;
    category?: string;
    status?: string;
    slaHoursRemaining?: number;
    department?: string;
  };
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
] as const;

export const AICivicAssistantModal: React.FC<AICivicAssistantModalProps> = ({
  complaintContext,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ta' | 'hi' | 'te' | 'kn'>('en');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Hello! I am your AI Civic Assistant. I can help you file grievances, identify the correct municipal department, explain SLA deadlines, or track existing complaints. How can I assist you today?',
    },
  ]);
  const [quickReplies, setQuickReplies] = useState<string[]>([
    'How to file a new complaint?',
    'What are the municipal SLA targets?',
    'Track my grievance status',
    'Report critical water / electrical hazard',
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await aiCivicService.chat({
        message: text,
        history: updatedHistory.slice(-4),
        language,
        complaintContext,
      });

      if (res.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);
        if (res.quickReplies && res.quickReplies.length > 0) {
          setQuickReplies(res.quickReplies);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'I am currently experiencing higher than normal network traffic. For emergency hazards, please dial municipal helpline 1913 directly.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = async (newLang: 'en' | 'ta' | 'hi' | 'te' | 'kn') => {
    setLanguage(newLang);
    const greetingPrompts: Record<string, string> = {
      en: 'Switched to English. How can I help you with municipal civic services?',
      ta: 'மொழி தமிழுக்கு மாற்றப்பட்டது. மாநகராட்சி சேவைகளில் உங்களுக்கு என்ன உதவி தேவை?',
      hi: 'भाषा हिन्दी में बदल दी गई है। नगर निगम सेवाओं में मैं आपकी क्या मदद करूँ?',
      te: 'భాష తెలుగుకు మార్చబడింది. పౌర సేవలలో మీకు ఏ సహాయం కావాలి?',
      kn: 'ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ. ಪೌರ ಸೇವೆಗಳಲ್ಲಿ ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
    };
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: greetingPrompts[newLang] || greetingPrompts.en },
    ]);
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open AI Civic Assistant"
          aria-expanded={isOpen}
          className="relative group bg-[#0F2854] hover:bg-[#0B132B] text-white p-3.5 rounded-full shadow-xl transition-transform hover:scale-105 flex items-center justify-center border-2 border-orange-500/40"
          title="Open AI Civic Assistant"
        >
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-orange-500 rounded-full border-2 border-white animate-pulse" />
          {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6 text-orange-400" />}
          <span className="sr-only">Toggle AI Civic Assistant</span>
        </button>
      </div>

      {/* Floating Chat Modal Pane */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby="civic-assistant-title"
          className="fixed bottom-22 right-4 sm:right-6 z-50 w-[92vw] sm:w-[410px] h-[560px] bg-white rounded-2xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header */}
          <div className="bg-[#0B132B] text-white px-4 py-3 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 id="civic-assistant-title" className="text-xs font-bold uppercase tracking-wider text-white">
                  Civic Assistant
                </h3>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Multilingual AI Active (5 Languages)
                </span>
              </div>
            </div>

            {/* Language Switcher Dropdown */}
            <div className="flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-blue-300" />
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value as any)}
                aria-label="AI Assistant Language"
                className="bg-white/10 text-white text-[11px] rounded px-1.5 py-0.5 border border-white/20 focus:outline-none focus:ring-1 focus:ring-orange-400"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Context Notice if attached to a specific grievance */}
          {complaintContext?.publicId && (
            <div className="bg-blue-50 border-b border-blue-200 px-3 py-1.5 text-[11px] text-blue-800 flex items-center justify-between">
              <span>Context: Ref #{complaintContext.publicId}</span>
              <span className="font-semibold">{complaintContext.status}</span>
            </div>
          )}

          {/* Chat Messages Log */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-[#0F2854] text-orange-400 flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`p-2.5 rounded-xl max-w-[82%] leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#0F2854] text-white rounded-br-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-2xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
                {m.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-500 text-xs py-1">
                <div className="w-6 h-6 rounded-full bg-[#0F2854] text-orange-400 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-slate-500 shadow-2xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies Bar */}
          {quickReplies.length > 0 && !loading && (
            <div className="p-2 bg-white border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {quickReplies.map((qr, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(qr)}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-orange-50 hover:text-orange-950 text-slate-700 text-[11px] shrink-0 border border-slate-200 transition-colors"
                >
                  {qr}
                </button>
              ))}
            </div>
          )}

          {/* Chat Input Bar */}
          <div className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              aria-label="Ask AI Assistant in your regional language"
              placeholder={`Ask in ${LANGUAGES.find((l) => l.code === language)?.label || 'any language'}...`}
              className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!inputMessage.trim() || loading}
              aria-label="Send message"
              className="p-2 rounded-lg bg-[#0F2854] text-white hover:bg-[#0B132B] disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
