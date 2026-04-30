import { Settings2, Calendar, Filter, Layers, Mail, Users, MessageSquare } from 'lucide-react';

export const ExecutiveControls = ({ config, setConfig }) => (
  <div className="w-80 bg-slate-900 border-l border-white/10 p-6 flex flex-col gap-8 overflow-y-auto">
    {/* Updated Header: Filters */}
    <div className="flex items-center gap-2 border-b border-white/5 pb-4">
      <Settings2 size={18} className="text-slate-400" />
      <h3 className="text-sm font-black uppercase tracking-widest text-slate-200">Filters</h3>
    </div>

    {/* Updated Section: Data Source */}
    <section className="space-y-4">
      <label className="text-xs font-black text-slate-500 flex items-center gap-2 uppercase">
        <Layers size={14} /> Data Source
      </label>
      <div className="grid grid-cols-3 gap-2 p-1 bg-black/40 rounded-2xl border border-white/5">
        <button 
          onClick={() => setConfig({...config, vault: 'email'})}
          className={`relative flex flex-col items-center gap-1 py-4 rounded-xl ${
            config.vault === 'email' ? 'bg-vault text-white' : 'text-slate-500 hover:bg-white/5'
          }`}
        >
          <Mail size={16} />
          <span className="text-[8px] font-black uppercase">Emails</span>
        </button>
        <button 
          onClick={() => setConfig({...config, vault: 'vendor'})}
          className={`relative flex flex-col items-center gap-1 py-4 rounded-xl ${
            config.vault === 'vendor' ? 'bg-vault text-white' : 'text-slate-500 hover:bg-white/5'
          }`}
        >
          <MessageSquare size={16} />
          <span className="text-[8px] font-black uppercase">Vendors</span>
        </button>
        <button 
          onClick={() => setConfig({...config, vault: 'upwork'})}
          className={`relative flex flex-col items-center gap-1 py-4 rounded-xl ${
            config.vault === 'upwork' ? 'bg-vault text-white' : 'text-slate-500 hover:bg-white/5'
          }`}
        >
          <Users size={16} />
          <span className="text-[8px] font-black uppercase">Talent</span>
        </button>
      </div>
    </section>

    {/* Updated Section: Search Range */}
    <section className="space-y-4">
      <label className="text-xs font-black text-slate-500 flex items-center gap-2 uppercase tracking-tighter">
        <Layers size={14} /> Search Range ({config.top_k})
      </label>
      <input 
        type="range" 
        min="3" 
        max="15" 
        className="w-full h-1.5 bg-white/5 rounded-full appearance-none accent-vault cursor-pointer" 
        value={config.top_k} 
        onChange={(e) => setConfig({...config, top_k: e.target.value})} 
      />
    </section>

    {config.vault === 'email' && (
      <section className="space-y-4">
        <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
          <Filter size={14} /> Filter by Domain
        </label>
        <input 
          type="text" 
          placeholder="@domain.com" 
          value={config.filter_sender} 
          onChange={(e) => setConfig({...config, filter_sender: e.target.value})} 
          className="vault-input w-full text-sm text-white bg-white/5 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-vault" 
        />
      </section>
    )}

    {/* Updated Section: Timeframe */}
    <section className="space-y-4">
      <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
        <Calendar size={14} /> Timeframe
      </label>
      <select 
        value={config.timeWindow} 
        onChange={(e) => setConfig({...config, timeWindow: e.target.value})} 
        className="vault-input w-full text-sm text-white appearance-none cursor-pointer bg-white/5 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-vault"
      >
        <option value="Last 7 Days">Last 7 Days</option>
        <option value="Last 30 Days">Last 30 Days</option>
        <option value="All-Time Archive">All-Time Archive</option>
      </select>
    </section>

    <div className="mt-auto pt-6 border-t border-white/5 flex p-1 bg-black/40 rounded-xl border border-white/5">
      {['gemma3:4b', 'llama3.2'].map((m) => (
        <button 
          key={m} 
          onClick={() => setConfig({...config, model: m})} 
          className={`flex-1 text-[10px] py-3 rounded-lg font-black uppercase ${
            config.model === m ? 'bg-vault text-white' : 'text-slate-600 hover:text-slate-400'
          }`}
        >
          {m.replace(':', ' ')}
        </button>
      ))}
    </div>
  </div>
);