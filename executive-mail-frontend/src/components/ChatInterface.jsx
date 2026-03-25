import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ChevronDown, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const ChatInterface = ({ messages, onSend }) => {
  const [input, setInput] = useState("");
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        {messages.map((msg, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            key={i} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] rounded-2xl p-5 shadow-lg ${
              msg.role === 'user' 
              ? 'bg-blue-600 border border-blue-500 text-white' 
              : 'vault-panel text-slate-200'
            }`}>
              
              {/* Markdown Renderer applied here. Added text-justify per your request */}
              <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap text-justify prose-p:leading-relaxed prose-li:marker:text-blue-400">
                {msg.loading && !msg.content ? (
                  <span className="flex gap-1 items-center h-5 opacity-50">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-75" />
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-150" />
                  </span>
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                )}
              </div>

              {msg.sources && msg.sources.length > 0 && (
                // Pass msg.loading down to the accordion
                <SourceAccordion sources={msg.sources} isGenerating={msg.loading} />
              )}
            </div>
          </motion.div>
        ))}
        <div ref={endOfMessagesRef} />
      </div>

      <div className="p-6 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent">
        <div className="max-w-4xl mx-auto flex gap-4 bg-white/5 border border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-xl transition-all focus-within:border-blue-500/50 focus-within:bg-white/10">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask your vault anything..."
            className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-white px-4 py-2 placeholder:text-slate-500"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-3 bg-blue-600 rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-lg shadow-blue-600/20"
          >
            <Send size={18} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

const SourceAccordion = ({ sources, isGenerating }) => {
  // Use a state that updates when isGenerating changes
  const [isOpen, setIsOpen] = useState(false);

  // Force open when generating so the executive can see the "evidence"
  useEffect(() => {
    if (isGenerating) {
      setIsOpen(true);
    }
  }, [isGenerating]);

  return (
    <div className="mt-5 pt-4 border-t border-white/10">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-blue-400 transition-colors w-full uppercase tracking-wider"
      >
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        Referenced Intelligence ({sources.length})
        {isGenerating && <span className="ml-auto text-blue-500 animate-pulse">Analyzing...</span>}
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden space-y-2 mt-3"
          >
            {sources.map((src, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-black/40 border border-white/5 text-[11px] flex justify-between items-center group hover:border-white/20 transition-all hover:bg-black/60">
                <div className="overflow-hidden pr-4">
                  <div className="font-bold text-slate-200 truncate">{src.subject}</div>
                  <div className="text-slate-400 mt-1 truncate">{src.sender} • {src.date}</div>
                </div>
                <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 flex-shrink-0" />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};