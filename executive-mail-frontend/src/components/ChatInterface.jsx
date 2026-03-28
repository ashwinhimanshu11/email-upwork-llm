import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ChevronDown, ExternalLink, Mail, UserCheck, Lock, ArrowDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const ChatInterface = ({ messages = [], onSend, isLocked, sessionVault }) => {
  const [input, setInput] = useState("");
  const [isAtBottom, setIsAtBottom] = useState(true);
  const scrollContainerRef = useRef(null);
  const endOfMessagesRef = useRef(null);

  // --- SMART SCROLL LOGIC ---
  const checkScrollStatus = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    // Check if user is within 100px of the bottom
    const isNearBottom = 
      container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
    setIsAtBottom(isNearBottom);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollStatus);
      return () => container.removeEventListener('scroll', checkScrollStatus);
    }
  }, [checkScrollStatus]);

  useEffect(() => {
    // Only auto-scroll if the user is already at the bottom or it's a new user message
    const lastMessage = messages[messages.length - 1];
    if (isAtBottom || lastMessage?.role === 'user') {
      endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAtBottom]);

  const handleSend = () => {
    if (!input.trim() || isLocked) return;
    onSend(input);
    setInput("");
    setIsAtBottom(true); // Force scroll to bottom for new request
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden transition-all duration-700">
      <div 
        ref={scrollContainerRef}
        className={`flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar transition-all duration-700 ${
          isLocked ? 'opacity-20 pointer-events-none grayscale blur-[2px]' : 'opacity-100'
        }`}
      >
        {messages.map((msg, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }}
            key={i} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] rounded-2xl p-5 shadow-xl transition-all duration-700 ${
              msg.role === 'user' 
              ? 'bg-vault border border-vault/50 text-white ml-12 shadow-vault/20' 
              : 'vault-panel text-slate-200 border border-white/5 shadow-black/40'
            }`}>
              
              <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap text-justify">
                {msg.loading && !msg.content ? (
                  <span className="flex gap-1 animate-bounce">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </span>
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                )}
              </div>

              {msg.sources?.length > 0 && (
                <SourceAccordion sources={msg.sources} isGenerating={msg.loading} />
              )}
            </div>
          </motion.div>
        ))}
        <div ref={endOfMessagesRef} className="h-4" />
      </div>

      {/* FLOAT BUTTON: Appears if you scroll up while the AI is talking */}
      <AnimatePresence>
        {!isAtBottom && messages.some(m => m.loading) && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={() => {
              setIsAtBottom(true);
              endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 p-3 bg-vault rounded-full shadow-2xl border border-white/20 text-white z-50 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
          >
            <ArrowDown size={14} />
            New Intelligence Below
          </motion.button>
        )}
      </AnimatePresence>

      <div className="p-6 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent">
        <AnimatePresence mode="wait">
          {isLocked ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="max-w-4xl mx-auto p-4 rounded-2xl bg-red-950/20 border border-red-500/30 flex items-center justify-between backdrop-blur-xl">
              <div className="flex items-center gap-3 text-red-400 text-xs font-black uppercase tracking-widest">
                <Lock size={16} className="animate-pulse" /> 
                Intelligence Mismatch: Switch to {sessionVault?.toUpperCase()}
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto flex gap-4 bg-white/5 border border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-xl transition-all focus-within:border-vault/50">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={`Query the ${sessionVault} vault...`}
                className="flex-1 bg-transparent border-none focus:outline-none text-white px-4 py-2 text-sm font-medium"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-3 bg-vault rounded-xl hover:opacity-80 transition-all shadow-lg shadow-vault/20"
              >
                <Send size={18} className="text-white" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const SourceAccordion = ({ sources = [], isGenerating }) => {
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => { if (isGenerating) setIsOpen(true); }, [isGenerating]);
  const isTalent = sources[0]?.type === 'upwork';
  return (
    <div className="mt-5 pt-4 border-t border-white/10">
      <button onClick={() => setIsOpen(!isOpen)} className={`flex items-center gap-2 text-[10px] font-black transition-colors duration-700 w-full uppercase tracking-[0.2em] ${isTalent ? 'text-emerald-400' : 'text-blue-400'}`}>
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        {isTalent ? 'Talent Match' : 'Intelligence Evidence'} ({sources.length})
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2 mt-4">
            {sources.map((src, idx) => (
              <div key={idx} className={`p-3 rounded-xl border text-[11px] flex justify-between items-center transition-all ${src.type === 'upwork' ? 'bg-emerald-950/20 border-emerald-500/10' : 'bg-blue-950/20 border-blue-500/10'}`}>
                <div className="flex gap-3 items-center truncate">
                  {src.type === 'upwork' ? <UserCheck size={14} className="text-emerald-400" /> : <Mail size={14} className="text-blue-400" />}
                  <div className="truncate"><div className="font-bold text-slate-200">{src.subject}</div><div className="text-slate-500">{src.sender} • {src.date}</div></div>
                </div>
                {src.url && <a href={src.url} target="_blank" rel="noreferrer" className="p-2 bg-white/5 rounded-lg text-emerald-400"><ExternalLink size={14} /></a>}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};