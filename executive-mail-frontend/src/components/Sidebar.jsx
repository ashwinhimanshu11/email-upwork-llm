import { Plus, Database, ShieldCheck, Trash2, Mail, Users } from 'lucide-react';

export const Sidebar = ({ emailCount, talentCount, sessions, activeId, onNewChat, onSelectChat, onDeleteChat, currentVault }) => (
  <aside className="w-64 bg-slate-900/50 backdrop-blur-xl border-r border-white/10 p-4 flex flex-col gap-6 z-20">
    <div className="flex items-center gap-2 px-2 py-4">
      <ShieldCheck className="text-vault w-8 h-8 transition-colors duration-700" />
      <h1 className="text-xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Vault AI</h1>
    </div>

    <button onClick={onNewChat} className="flex items-center justify-center gap-2 w-full p-4 rounded-xl bg-vault/10 border border-vault/30 hover:bg-vault/20 transition-all duration-500 text-slate-100 shadow-lg shadow-vault/5">
      <Plus size={18} className="text-vault" />
      <span className="font-black text-[10px] uppercase tracking-[0.2em]">New Session</span>
    </button>

    <nav className="flex-1 space-y-1 overflow-y-auto mt-4 pr-2 custom-scrollbar">
      <p className="text-[9px] uppercase tracking-[0.3em] text-slate-600 font-black px-2 mb-4 tracking-widest">History</p>
      {sessions.map((session) => (
        <div 
          key={session.id}
          onClick={() => onSelectChat(session.id)}
          className={`group flex items-center gap-3 p-3.5 text-[10px] rounded-xl cursor-pointer transition-all duration-500 border ${
            activeId === session.id 
            ? 'bg-white/5 border-vault/40 text-white shadow-inner' 
            : 'border-transparent text-slate-500 hover:bg-white/5'
          }`}
        >
          {session.vault === 'upwork' 
            ? <Users size={14} className={activeId === session.id ? "text-emerald-400" : "text-slate-700"} /> 
            : <Mail size={14} className={activeId === session.id ? "text-blue-400" : "text-slate-700"} />
          }
          <span className="flex-1 truncate font-black uppercase tracking-tight">{session.title}</span>
          <button 
            onClick={(e) => { e.stopPropagation(); onDeleteChat(session.id); }}
            className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-400 transition-all bg-black/40 rounded-lg"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
    </nav>

    <div className="space-y-2 mt-auto">
      <div className={`p-4 rounded-2xl border transition-all duration-700 flex items-center justify-between ${currentVault === 'email' ? 'bg-vault/10 border-vault/40' : 'bg-black/20 border-white/5 opacity-40'}`}>
        <div className="flex items-center gap-2"><Mail size={14} className="text-vault" /><span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Archive</span></div>
        <span className="text-xs font-mono font-bold text-white">{emailCount.toLocaleString()}</span>
      </div>
      <div className={`p-4 rounded-2xl border transition-all duration-700 flex items-center justify-between ${currentVault === 'upwork' ? 'bg-vault/10 border-vault/40' : 'bg-black/20 border-white/5 opacity-40'}`}>
        <div className="flex items-center gap-2"><Users size={14} className="text-vault" /><span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Talent</span></div>
        <span className="text-xs font-mono font-bold text-white">{talentCount.toLocaleString()}</span>
      </div>
    </div>
  </aside>
);