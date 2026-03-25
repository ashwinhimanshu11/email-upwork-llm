import { MessageSquarePlus, Database, ShieldCheck, Trash2, MessageSquare } from 'lucide-react';

export const Sidebar = ({ emailCount, sessions, activeId, onNewChat, onSelectChat, onDeleteChat }) => (
  <aside className="w-64 bg-slate-900/50 backdrop-blur-xl border-r border-white/10 p-4 flex flex-col gap-6 z-20">
    <div className="flex items-center gap-2 px-2 py-4">
      <ShieldCheck className="text-blue-400 w-8 h-8" />
      <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
        Vault AI
      </h1>
    </div>

    <button 
      onClick={onNewChat}
      className="flex items-center justify-center gap-2 w-full p-3 rounded-lg bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/40 transition-all text-blue-100 shadow-lg shadow-blue-900/20"
    >
      <MessageSquarePlus size={18} />
      <span className="font-medium text-sm">New Session</span>
    </button>

    <nav className="flex-1 space-y-1 overflow-y-auto mt-4 pr-2 custom-scrollbar">
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-2 mb-3">Recent Intelligence</p>
      
      {sessions.map((session) => (
        <div 
          key={session.id}
          onClick={() => onSelectChat(session.id)}
          className={`group flex items-center gap-3 p-3 text-sm rounded-md cursor-pointer transition-all border ${
            activeId === session.id 
            ? 'bg-white/10 border-white/20 text-white shadow-inner' 
            : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-300'
          }`}
        >
          <MessageSquare size={14} className={activeId === session.id ? 'text-blue-400' : 'text-slate-600'} />
          <span className="flex-1 truncate pr-2 font-medium">{session.title}</span>
          
          <button 
            onClick={(e) => onDeleteChat(session.id, e)}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-all"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
    </nav>

    <div className="bg-black/40 rounded-xl p-4 border border-white/10 mt-auto">
      <div className="flex items-center gap-3 mb-2">
        <Database size={16} className="text-emerald-400 animate-pulse" />
        <span className="text-xs font-semibold text-slate-300">System Status</span>
      </div>
      <div className="text-2xl font-mono text-white tracking-tight">{emailCount.toLocaleString()}</div>
      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1">Indexed Emails</p>
    </div>
  </aside>
);