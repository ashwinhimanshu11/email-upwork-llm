import { Settings2, Calendar, Filter, Layers } from 'lucide-react';

export const ExecutiveControls = ({ config, setConfig }) => (
  <div className="w-80 bg-slate-900/30 border-l border-white/10 p-6 flex flex-col gap-8 overflow-y-auto">
    <div className="flex items-center gap-2 border-b border-white/5 pb-4">
      <Settings2 size={18} className="text-slate-400" />
      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-200">Refinement</h3>
    </div>

    <section className="space-y-4">
      <label className="text-xs font-bold text-slate-400 flex items-center gap-2">
        <Layers size={14} /> CONTEXT DEPTH (Top-K: {config.top_k})
      </label>
      <input 
        type="range" min="3" max="15" 
        className="w-full accent-blue-500" 
        value={config.top_k}
        onChange={(e) => setConfig({...config, top_k: e.target.value})}
      />
      <div className="flex justify-between text-[10px] font-mono text-slate-500">
        <span>Fast (3)</span>
        <span>Deep (15)</span>
      </div>
    </section>

    <section className="space-y-4">
      <label className="text-xs font-bold text-slate-400 flex items-center gap-2">
        <Filter size={14} /> SENDER/DOMAIN
      </label>
      <input 
        type="text" 
        placeholder="e.g. @apple.com"
        value={config.filter_sender}
        onChange={(e) => setConfig({...config, filter_sender: e.target.value})}
        className="vault-input w-full text-sm text-white"
      />
    </section>

    <section className="space-y-4">
      <label className="text-xs font-bold text-slate-400 flex items-center gap-2">
        <Calendar size={14} /> DATE WINDOW
      </label>
      <select 
        value={config.timeWindow}
        onChange={(e) => setConfig({...config, timeWindow: e.target.value})}
        className="vault-input w-full text-sm text-white appearance-none cursor-pointer"
      >
        <option value="Last 7 Days">Last 7 Days</option>
        <option value="Last 30 Days">Last 30 Days</option>
        <option value="All-Time Archive">All-Time Archive</option>
      </select>
    </section>

    <div className="mt-auto pt-6 border-t border-white/5">
      <div className="flex p-1 bg-black/40 rounded-lg border border-white/10">
        <button 
          onClick={() => setConfig({...config, model: 'gemma3:4b'})}
          className={`flex-1 text-[10px] py-2 rounded-md transition-all ${config.model === 'gemma3:4b' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
          GEMMA 3:4B
        </button>
        <button 
          onClick={() => setConfig({...config, model: 'llama3.2'})}
          className={`flex-1 text-[10px] py-2 rounded-md transition-all ${config.model === 'llama3.2' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
          LLAMA 3.2
        </button>
      </div>
    </div>
  </div>
);