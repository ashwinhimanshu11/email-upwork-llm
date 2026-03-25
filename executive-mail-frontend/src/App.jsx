import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { ExecutiveControls } from './components/ExecutiveControls';

const calculateDateRange = (windowStr) => {
  const end = new Date();
  const start = new Date();
  if (windowStr === 'Last 7 Days') start.setDate(end.getDate() - 7);
  else if (windowStr === 'Last 30 Days') start.setDate(end.getDate() - 30);
  else start.setFullYear(2000); 
  return [start.toISOString().split('T')[0], end.toISOString().split('T')[0]];
};

function App() {
  // --- PERSISTENT STATE ---
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('vault_sessions');
    return saved ? JSON.parse(saved) : [{ id: '1', title: 'New Intelligence Session', messages: [] }];
  });
  
  const [activeId, setActiveId] = useState(sessions[0].id);
  const [emailCount, setEmailCount] = useState(0);
  const [config, setConfig] = useState({ top_k: 8, model: 'gemma3:4b', timeWindow: 'Last 30 Days', filter_sender: '' });

  useEffect(() => {
    localStorage.setItem('vault_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    fetch('http://localhost:8000/stats').then(res => res.json()).then(data => setEmailCount(data.total_emails));
  }, []);

  const activeSession = sessions.find(s => s.id === activeId) || sessions[0];

  const handleNewSession = () => {
    const newId = Date.now().toString();
    const newSess = { id: newId, title: 'New Session', messages: [] };
    setSessions([newSess, ...sessions]);
    setActiveId(newId);
  };

  const handleDeleteSession = (id, e) => {
    e.stopPropagation();
    const filtered = sessions.filter(s => s.id !== id);
    if (filtered.length === 0) {
      handleNewSession();
    } else {
      setSessions(filtered);
      if (activeId === id) setActiveId(filtered[0].id);
    }
  };

  const handleSendMessage = async (text) => {
    // 1. Initial State Setup
    const userMsg = { role: 'user', content: text };
    const loadingMsg = { role: 'assistant', content: "", sources: [], loading: true };
    
    let updatedTitle = activeSession.title;
    if (activeSession.messages.length === 0) {
      updatedTitle = text.length > 30 ? text.substring(0, 30) + "..." : text;
    }

    // Update session immediately with User message and Title
    setSessions(prev => prev.map(s => s.id === activeId ? 
      { ...s, title: updatedTitle, messages: [...s.messages, userMsg, loadingMsg] } : s
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
          date_range: calculateDateRange(config.timeWindow),
          filter_sender: config.filter_sender || null
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulatedContent = "";
      let capturedSources = [];
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        
        if (done) {
          setSessions(prev => prev.map(s => s.id === activeId ? {
            ...s,
            messages: s.messages.map((m, i) => i === s.messages.length - 1 ? { ...m, loading: false } : m)
          } : s));
          break;
        }
        
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

        // Live update the active session's last message
        setSessions(prev => prev.map(s => s.id === activeId ? {
          ...s,
          messages: s.messages.map((m, i) => i === s.messages.length - 1 ? 
            { ...m, content: accumulatedContent, sources: capturedSources } : m)
        } : s));
      }
    } catch (err) { console.error("Link Severed:", err); }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar 
        emailCount={emailCount} 
        sessions={sessions}
        activeId={activeId}
        onNewChat={handleNewSession}
        onSelectChat={setActiveId}
        onDeleteChat={handleDeleteSession}
      />
      <main className="flex-1 flex overflow-hidden z-10 relative">
        <ChatInterface messages={activeSession.messages} onSend={handleSendMessage} />
        <ExecutiveControls config={config} setConfig={setConfig} />
      </main>
    </div>
  );
}

export default App;