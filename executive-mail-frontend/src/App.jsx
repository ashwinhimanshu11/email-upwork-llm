import { useState, useEffect } from 'react';
/* Removed framer-motion imports to eliminate animation overhead */
import { 
  AlertTriangle, Mail, MessageSquare, Plus, Users, X 
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { ExecutiveControls } from './components/ExecutiveControls';

function App() {
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('vault_sessions');
    try {
      /* Rebranded initial title: "New Discussion" */
      return saved ? JSON.parse(saved).map(s => ({ ...s, vault: s.vault || 'email' })) : 
      [{ id: '1', title: 'New Discussion', messages: [], vault: 'email' }];
    } catch {
      return [{ id: '1', title: 'New Discussion', messages: [], vault: 'email' }];
    }
  });
  
  const [activeId, setActiveId] = useState(sessions[0]?.id || '1');
  const [config, setConfig] = useState({ 
    top_k: 8, model: 'gemma3:4b', timeWindow: 'Last 30 Days', filter_sender: '', vault: 'email' 
  });

  const [deleteModal, setDeleteModal] = useState({ show: false, id: null });
  const [createModal, setCreateModal] = useState(false);

  // Dynamic stats fetched from Postgres
  const [dbStats, setDbStats] = useState({ email: 0, talent: 0, vendor: 0 });

  const activeSession = sessions.find(s => s.id === activeId) || sessions[0];
  const isVaultMismatch = config.vault !== activeSession?.vault;

  useEffect(() => {
    localStorage.setItem('vault_sessions', JSON.stringify(sessions));
    document.documentElement.setAttribute('data-vault', config.vault);
  }, [sessions, config.vault]);

  // Fetch real database counts on load
  useEffect(() => {
    fetch('http://localhost:8000/stats')
      .then(res => res.json())
      .then(data => setDbStats({ email: data.total_emails, talent: data.total_talent, vendor: data.total_vendors }))
      .catch(err => console.error("Could not fetch DB stats", err));
  }, []);

  const finalizeNewSession = (vaultType) => {
    const id = Date.now().toString();
    const titleType = vaultType === 'vendor' ? 'Vendor' : vaultType === 'upwork' ? 'Talent' : 'Email';
    /* Rebranded session title: "[Type] Thread" */
    const newSess = { 
      id, 
      title: `${titleType} Thread`, 
      messages: [], 
      vault: vaultType 
    };
    setSessions([newSess, ...sessions]);
    setActiveId(id);
    setConfig(prev => ({ ...prev, vault: vaultType }));
    setCreateModal(false);
  };

  const handleSendMessage = async (text) => {
    if (isVaultMismatch) return;
    const userMsg = { role: 'user', content: text };
    const loadingMsg = { role: 'assistant', content: "", sources: [], loading: true };
    
    setSessions(prev => prev.map(s => s.id === activeId ? 
      { ...s, messages: [...s.messages, userMsg, loadingMsg] } : s
    ));

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          history: activeSession.messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
          top_k: parseInt(config.top_k),
          model: config.model,
          date_range: ["2000-01-01", "2026-12-31"],
          vault: config.vault
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulatedContent = "";
      let capturedSources = [];
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.type === "sources") capturedSources = parsed.data;
            else if (parsed.type === "chunk") accumulatedContent += parsed.data;
          } catch (e) {}
        }

        setSessions(prev => prev.map(s => s.id === activeId ? {
          ...s, messages: s.messages.map((m, i) => i === s.messages.length - 1 ? 
            { ...m, content: accumulatedContent, sources: capturedSources, loading: !done } : m)
        } : s));
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans relative">
      <Sidebar 
        emailCount={dbStats.email} talentCount={dbStats.talent} vendorCount={dbStats.vendor}
        sessions={sessions} activeId={activeId}
        onNewChat={() => setCreateModal(true)} 
        onSelectChat={(id) => {
            setActiveId(id);
            const target = sessions.find(s => s.id === id);
            if (target) setConfig(prev => ({ ...prev, vault: target.vault }));
        }}
        onDeleteChat={(id) => setDeleteModal({ show: true, id })}
        currentVault={config.vault}
      />
      
      <main className="flex-1 flex overflow-hidden z-10 relative">
        <ChatInterface 
          messages={activeSession?.messages || []} 
          onSend={handleSendMessage} 
          isLocked={isVaultMismatch}
          sessionVault={activeSession?.vault || 'email'}
        />
        <ExecutiveControls config={config} setConfig={setConfig} />
      </main>

      {/* Start a New Thread Modal - Removed motion.div and backdrop-blur */}
      {createModal && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-950/90">
          <div className="w-[600px] p-8 rounded-3xl bg-slate-900 border border-white/10 shadow-2xl relative">
            <button onClick={() => setCreateModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20} /></button>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20"><Plus className="text-blue-400" size={32} /></div>
              <h3 className="text-xl font-black uppercase tracking-widest text-white">Start a New Thread</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <button onClick={() => finalizeNewSession('email')} className="group flex flex-col items-center gap-4 p-6 rounded-2xl bg-blue-600/5 border border-blue-500/10 hover:border-blue-500/50">
                <Mail size={32} className="text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Emails</span>
              </button>
              <button onClick={() => finalizeNewSession('vendor')} className="group flex flex-col items-center gap-4 p-6 rounded-2xl bg-purple-600/5 border border-purple-500/10 hover:border-purple-500/50">
                <MessageSquare size={32} className="text-purple-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Vendors</span>
              </button>
              <button onClick={() => finalizeNewSession('upwork')} className="group flex flex-col items-center gap-4 p-6 rounded-2xl bg-emerald-600/5 border border-emerald-500/10 hover:border-emerald-500/50">
                <Users size={32} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Talent</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Thread Modal - Removed motion.div and backdrop-blur */}
      {deleteModal.show && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-950/80">
          <div className="w-96 p-8 rounded-3xl bg-slate-900 border border-white/10 shadow-2xl">
            <div className="flex items-center gap-3 text-red-500 mb-4"><AlertTriangle size={24} /><h3 className="text-lg font-black uppercase">Delete Thread?</h3></div>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed font-medium">Permanently remove this discussion from your recent list?</p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteModal({ show: false, id: null })} className="flex-1 py-4 rounded-xl bg-white/5 font-black text-[10px] uppercase tracking-widest">Cancel</button>
              <button onClick={() => {
                const filtered = sessions.filter(s => s.id !== deleteModal.id);
                setSessions(filtered.length ? filtered : [{ id: Date.now().toString(), title: 'New Thread', messages: [], vault: 'email' }]);
                if (activeId === deleteModal.id) setActiveId(filtered[0]?.id || '1');
                setDeleteModal({ show: false, id: null });
              }} className="flex-1 py-4 rounded-xl bg-red-600 hover:bg-red-500 font-black text-[10px] uppercase tracking-widest">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;