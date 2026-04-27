import { motion } from 'motion/react';
import { Slang } from '../types';
import { Quote, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface SlangDetailProps {
  slang: Slang;
}

export default function SlangDetail({ slang }: SlangDetailProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(slang.term);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-full flex flex-col">
      <div className="flex-1 p-12 md:p-20 flex flex-col justify-center max-w-4xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[10px] font-mono tracking-[0.3em] text-white/30 uppercase">
            / {slang.term.toLowerCase()} / • {slang.category || 'SLANG'}
          </div>
          <button 
            onClick={copyToClipboard}
            aria-label="Copy slang to clipboard"
            className="p-3 rounded-lg bg-white/5 hover:bg-white text-black border border-white/5 transition-all group relative active:scale-90"
          >
            {copied ? <Check size={16} /> : <Copy size={16} className="text-white group-hover:text-black" />}
            {copied && (
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 text-[10px] bg-white text-black px-3 py-1.5 rounded-full font-black uppercase tracking-widest whitespace-nowrap shadow-xl">
                Ready to Slay
              </span>
            )}
          </button>
        </div>

        <motion.h2 
          key={slang.id + 'title'}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-7xl md:text-[10rem] font-black italic tracking-tighter mb-12 uppercase leading-[0.8] select-none"
        >
          {slang.term}
        </motion.h2>

        <div className="space-y-16 max-w-2xl">
          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-white/30 tracking-[0.3em] border-b border-brand-border pb-3">Definition</h3>
            <p className="text-2xl md:text-3xl font-light leading-relaxed text-white/90">
              {slang.meaning}
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-white/30 tracking-[0.3em] border-b border-brand-border pb-3">Millennial Translation</h3>
            <div className="flex flex-wrap gap-3">
              <span className="px-5 py-2 bg-white text-black text-[11px] font-black rounded-full uppercase tracking-widest shadow-lg">
                {slang.millennialTranslation}
              </span>
              <span className="px-5 py-2 border border-white/20 text-white/40 text-[11px] font-black rounded-full uppercase tracking-widest">
                Millennial-Friendly
              </span>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-white/30 tracking-[0.3em] border-b border-brand-border pb-3">In the Wild</h3>
            <div className="text-xl md:text-2xl italic text-white/50 leading-relaxed font-light relative pl-8 border-l border-brand-accent">
              <Quote size={24} className="absolute -left-3 -top-4 opacity-10 rotate-180" />
              "{slang.example}"
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

