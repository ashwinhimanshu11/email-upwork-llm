import { useState, useRef, useEffect, useCallback } from 'react';
/* Removed framer-motion to maintain high performance during streaming */
import { Send, ChevronDown, ExternalLink, Mail, UserCheck, Lock, ArrowDown, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const SourceAccordion = ({ sources = [], isGenerating }) => {
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => { if (isGenerating) setIsOpen(true); }, [isGenerating]);
  
  if (!sources.length) return null;

  const vaultType = sources[0]?.type || 'email';
  const colorMap = {
    upwork: 'text-emerald-400 border-emerald-500/10 bg-emerald-950/20',
    vendor: 'text-purple-400 border-purple-500/10 bg-purple-950/20',
    email: 'text-blue-400 border-blue-500/10 bg-blue-950/20'
  };
  
  /* Updated Map: Professional references instead of "Intelligence Evidence" */
  const titleMap = { 
    upwork: 'Profiles', 
    vendor: 'Vendor Records', 
    email: 'References' 
  };

  return (
    <div className="mt-5 pt-4 border-t border-white/10">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`flex items-center gap-2 text-[10px] font-black w-full uppercase tracking-[0.2em] ${colorMap[vaultType].split(' ')[0]}`}
      >
        <ChevronDown 
          size={14} 
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }} 
        />
        {titleMap[vaultType]} ({sources.length})
      </button>
      
      {isOpen && (
        <div className="overflow-hidden space-y-2 mt-4">
          {sources.map((src, idx) => (
            <div key={idx} className={`p-3 rounded-xl border text-[11px] flex justify-between items-center ${colorMap[src.type]}`}>
              <div className="flex gap-3 items-center truncate">
                {src.type === 'upwork' ? <UserCheck size={14} className="text-emerald-400" /> : 
                 src.type === 'vendor' ? <MessageSquare size={14} className="text-purple-400" /> : 
                 <Mail size={14} className="text-blue-400" />}
                <div className="truncate">
                  <div className="font-bold text-slate-200">{src.subject}</div>
                  <div className="text-slate-500">{src.sender} • {src.date}</div>
                </div>
              </div>
              {src.url && (
                <a href={src.url} target="_blank" rel="noreferrer" className="p-2 bg-white/5 rounded-lg opacity-80 hover:opacity-100">
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const ChatInterface = ({ messages = [], onSend, isLocked, sessionVault }) => {
  const [input, setInput] = useState("");
  const [isAtBottom, setIsAtBottom] = useState(true);
  const scrollContainerRef = useRef(null);
  const endOfMessagesRef = useRef(null);

  const checkScrollStatus = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
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
    const lastMessage = messages[messages.length - 1];
    if (isAtBottom || lastMessage?.role === 'user') {
      /* Removed smooth behavior to prevent browser scroll lag during high-frequency token updates */
      endOfMessagesRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [messages, isAtBottom]);

  const handleSend = () => {
    if (!input.trim() || isLocked) return;
    onSend(input);
    setInput("");
    setIsAtBottom(true); 
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-950/50">
      <div 
        ref={scrollContainerRef}
        /* Removed transitions and backdrop blurs */
        className={`flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar ${
          isLocked ? 'opacity-20 pointer-events-none grayscale' : 'opacity-100'
        }`}
      >
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] rounded-2xl p-5 shadow-xl ${
              msg.role === 'user' 
              ? 'bg-vault border border-vault/50 text-white ml-12' 
              : 'bg-slate-900 text-slate-200 border border-white/5'
            }`}>
              
              <div className="max-w-none text-sm leading-relaxed font-light prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/20 prose-li:my-1 prose-ul:my-2 space-y-2">
                {msg.loading && !msg.content ? (
                  <span className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  </span>
                ) : (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                )}
              </div>

              {msg.sources?.length > 0 && (
                <SourceAccordion sources={msg.sources} isGenerating={msg.loading} />
              )}
            </div>
          </div>
        ))}
        <div ref={endOfMessagesRef} className="h-4" />
      </div>

      {/* Updated Label: New Messages */}
      {!isAtBottom && messages.some(m => m.loading) && (
        <button
          onClick={() => { 
            setIsAtBottom(true); 
            endOfMessagesRef.current?.scrollIntoView({ behavior: "auto" }); 
          }}
          className="absolute bottom-32 left-1/2 -translate-x-1/2 p-3 bg-vault rounded-full shadow-2xl border border-white/20 text-white z-50 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
        >
          <ArrowDown size={14} /> New Messages
        </button>
      )}

      <div className="p-6 bg-slate-950">
        {isLocked ? (
          <div className="max-w-4xl mx-auto p-4 rounded-2xl bg-red-950/20 border border-red-500/30 flex items-center justify-between">
            {/* Updated Label: Source Mismatch */}
            <div className="flex items-center gap-3 text-red-400 text-xs font-black uppercase tracking-widest">
              <Lock size={16} /> 
              Source Mismatch: Switch to {sessionVault?.toUpperCase()}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto flex gap-4 bg-white/5 border border-white/10 rounded-2xl p-2 shadow-2xl">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              /* Updated Placeholder: Search in... */
              placeholder={`Search in ${sessionVault}...`}
              className="flex-1 bg-transparent border-none focus:outline-none text-white px-4 py-2 text-sm font-medium"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-3 bg-vault rounded-xl hover:bg-vault/80"
            >
              <Send size={18} className="text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};