import { Settings2, Calendar, Filter, Layers, Mail, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export const ExecutiveControls = ({ config, setConfig }) => (
  <div className="w-80 bg-slate-900/30 border-l border-white/10 p-6 flex flex-col gap-8 overflow-y-auto transition-all duration-700">
    <div className="flex items-center gap-2 border-b border-white/5 pb-4">
      <Settings2 size={18} className="text-slate-400" />
      <h3 className="text-sm font-black uppercase tracking-widest text-slate-200">Refinement</h3>
    </div>

    <section className="space-y-4">
      <label className="text-xs font-black text-slate-500 flex items-center gap-2 uppercase">
        <Layers size={14} /> Vault Source
      </label>
      <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-2xl border border-white/5">
        <button 
          onClick={() => setConfig({...config, vault: 'email'})}
          className={`relative flex flex-col items-center gap-1 py-4 rounded-xl transition-all duration-500 ${config.vault === 'email' ? 'text-white' : 'text-slate-500'}`}
        >
          {config.vault === 'email' && <motion.div layoutId="active-v" className="absolute inset-0 bg-vault rounded-xl shadow-lg" />}
          <Mail size={18} className="relative z-10" />
          <span className="relative z-10 text-[9px] font-black uppercase">Email</span>
        </button>
        <button 
          onClick={() => setConfig({...config, vault: 'upwork'})}
          className={`relative flex flex-col items-center gap-1 py-4 rounded-xl transition-all duration-500 ${config.vault === 'upwork' ? 'text-white' : 'text-slate-500'}`}
        >
          {config.vault === 'upwork' && <motion.div layoutId="active-v" className="absolute inset-0 bg-vault rounded-xl shadow-lg" />}
          <Users size={18} className="relative z-10" />
          <span className="relative z-10 text-[9px] font-black uppercase">Upwork</span>
        </button>
      </div>
    </section>

    <section className="space-y-4">
      <label className="text-xs font-black text-slate-500 flex items-center gap-2 uppercase tracking-tighter">
        <Layers size={14} /> Context Depth (Top-{config.top_k})
      </label>
      <input type="range" min="3" max="15" className="w-full h-1.5 bg-white/5 rounded-full appearance-none accent-vault" value={config.top_k} onChange={(e) => setConfig({...config, top_k: e.target.value})} />
    </section>

    {config.vault === 'email' && (
      <section className="space-y-4">
        <label className="text-xs font-black text-slate-500 uppercase"><Filter size={14} /> Domain Filter</label>
        <input type="text" placeholder="@domain.com" value={config.filter_sender} onChange={(e) => setConfig({...config, filter_sender: e.target.value})} className="vault-input w-full text-sm text-white" />
      </section>
    )}

    <section className="space-y-4">
      <label className="text-xs font-black text-slate-500 uppercase"><Calendar size={14} /> Date Window</label>
      <select value={config.timeWindow} onChange={(e) => setConfig({...config, timeWindow: e.target.value})} className="vault-input w-full text-sm text-white appearance-none cursor-pointer">
        <option value="Last 7 Days">Last 7 Days</option>
        <option value="Last 30 Days">Last 30 Days</option>
        <option value="All-Time Archive">All-Time Archive</option>
      </select>
    </section>

    <div className="mt-auto pt-6 border-t border-white/5 flex p-1 bg-black/40 rounded-xl border border-white/5">
      {['gemma3:4b', 'llama3.2'].map((m) => (
        <button key={m} onClick={() => setConfig({...config, model: m})} className={`flex-1 text-[10px] py-3 rounded-lg transition-all font-black uppercase ${config.model === m ? 'bg-vault text-white shadow-lg' : 'text-slate-600'}`}>{m.replace(':', ' ')}</button>
      ))}
    </div>
  </div>
);