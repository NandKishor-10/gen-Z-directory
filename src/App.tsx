/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useRef, ChangeEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Upload, X, Info, Quote, Menu, ChevronLeft } from 'lucide-react';
import { initialSlangs } from './data/initialSlangs';
import { Slang } from './types';
import SlangDetail from './components/SlangCard';
import Skeleton from './components/Skeleton';

export default function App() {
  const [slangs, setSlangs] = useState<Slang[]>(initialSlangs);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSlangId, setSelectedSlangId] = useState<string | null>(null);

  useEffect(() => {
    // Simulate initial data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      setSelectedSlangId(initialSlangs.find(s => s.id === 'aura')?.id || initialSlangs[0]?.id || null);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);
  const [isImporting, setIsImporting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredSlangs = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return [...slangs].sort((a, b) => a.term.localeCompare(b.term));

    return slangs
      .filter(s => 
        s.term.toLowerCase().includes(query) ||
        s.meaning.toLowerCase().includes(query) ||
        s.millennialTranslation.toLowerCase().includes(query)
      )
      .sort((a, b) => {
        const aTerm = a.term.toLowerCase();
        const bTerm = b.term.toLowerCase();
        
        // Exact term match
        if (aTerm === query && bTerm !== query) return -1;
        if (bTerm === query && aTerm !== query) return 1;

        // Starts with
        const aStarts = aTerm.startsWith(query);
        const bStarts = bTerm.startsWith(query);
        if (aStarts && !bStarts) return -1;
        if (bStarts && !aStarts) return 1;

        // Term includes query
        const aIncludes = aTerm.includes(query);
        const bIncludes = bTerm.includes(query);
        if (aIncludes && !bIncludes) return -1;
        if (bIncludes && !aIncludes) return 1;

        return a.term.localeCompare(b.term);
      });
  }, [slangs, searchQuery]);

  const selectedSlang = useMemo(() => 
    slangs.find(s => s.id === selectedSlangId) || slangs[0], 
  [slangs, selectedSlangId]);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      const newSlangs = lines.slice(1).map((line, index): Slang | null => {
        // More robust CSV splitting handling basic quotes
        const parts = (line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [])
          .map(s => s.trim().replace(/^"|"$/g, ''));
        
        const [term, meaning, translation, example, category] = parts;
        if (!term) return null;
        return {
          id: `imported-${Date.now()}-${index}`,
          term: term || 'Unknown',
          meaning: meaning || 'No definition provided',
          millennialTranslation: translation || 'No translation provided',
          example: example || 'No example provided',
          category: category || 'General'
        };
      }).filter((s): s is Slang => s !== null);

      if (newSlangs.length > 0) {
        setSlangs(prev => [...newSlangs, ...prev]);
        setIsImporting(false);
        setSelectedSlangId(newSlangs[0].id);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-black text-white font-sans selection:bg-white selection:text-black border border-brand-border">
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Column 1: Sidebar Index (Hidden on mobile by default) */}
      <aside className={`fixed inset-y-0 left-0 z-[70] w-12 border-r border-brand-border bg-black flex flex-col items-center py-6 shrink-0 h-full transition-transform lg:translate-x-0 lg:relative ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="w-8 lg:w-9 h-8 lg:h-9 bg-white rounded-full flex items-center justify-center mb-10 shrink-0 group hover:rotate-12 transition-transform cursor-pointer">
          <span className="text-black font-black text-lg italic leading-none">Z</span>
        </div>
        
        <div className="flex-1 flex flex-col gap-1 overflow-y-auto w-full px-1 opacity-30 hover:opacity-100 transition-opacity custom-scrollbar no-scrollbar pb-10 scroll-smooth">
          {alphabet.map(letter => (
            <button 
              key={letter}
              onClick={() => {
                const firstWithLetter = slangs.find(s => s.term.toUpperCase().startsWith(letter));
                if (firstWithLetter) {
                  setSelectedSlangId(firstWithLetter.id);
                  setSearchQuery('');
                  
                  // Scroll the list to the selected item
                  setTimeout(() => {
                    document.getElementById(`slang-${firstWithLetter.id}`)?.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'center' 
                    });
                  }, 50);

                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }
              }}
              className="text-[9px] lg:text-[10px] font-bold text-center py-1 lg:py-2 hover:bg-brand-accent rounded transition-colors"
            >
              {letter}
            </button>
          ))}
        </div>

        <button 
          onClick={() => setIsImporting(true)}
          className="mt-auto p-2 lg:p-3 text-white/40 hover:text-white transition-colors"
          title="Import CSV"
        >
          <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
        </button>
      </aside>

      {/* Column 2: List View (Conditionally visible on mobile) */}
      <section className={`fixed inset-y-0 left-12 lg:left-0 z-[70] w-72 border-r border-brand-border flex flex-col shrink-0 h-full bg-black transition-transform lg:translate-x-0 lg:relative ${isSidebarOpen ? 'translate-x-0' : '-translate-x-[calc(100%+64px)]'}`}>
        <div className="p-6 border-b border-brand-border space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-[10px] tracking-[0.3em] uppercase font-bold text-white/40">The Slang Directory ({slangs.length})</h1>
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="lg:hidden p-1 hover:bg-white/10 rounded"
              aria-label="Close Sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/20">
              <Search size={14} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search slangs..."
              className="w-full bg-brand-gray border border-brand-accent rounded-lg py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-white transition-colors placeholder:text-white/10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar scroll-smooth">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              // List Skeletons
              Array.from({ length: 12 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="p-3 rounded-lg border border-transparent flex justify-between items-center opacity-60">
                  <Skeleton width={`${Math.floor(Math.random() * (70 - 40) + 40)}%`} height="1rem" />
                  <Skeleton width="15%" height="0.5rem" />
                </div>
              ))
            ) : (
              filteredSlangs.map((slang) => (
                <motion.button
                  key={slang.id}
                  id={`slang-${slang.id}`}
                  layout
                  onClick={() => {
                    setSelectedSlangId(slang.id);
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded-lg flex justify-between items-center transition-all ${
                    selectedSlangId === slang.id 
                      ? 'bg-brand-gray border border-brand-accent' 
                      : 'hover:bg-brand-gray/50 border border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <span className="text-sm font-medium">{slang.term}</span>
                  {slang.category && (
                    <span className="text-[8px] uppercase tracking-widest text-white/30">{slang.category}</span>
                  )}
                </motion.button>
              ))
            )}
          </AnimatePresence>

          {!isLoading && filteredSlangs.length === 0 && (
            <div className="py-20 text-center opacity-30 italic text-sm">No slangs found</div>
          )}
        </div>
      </section>

      {/* Column 3: Detail View */}
      <main className="flex-1 overflow-y-auto bg-brand-dark relative custom-scrollbar flex flex-col w-full h-full">
        {/* Mobile Navbar */}
        <nav className="lg:hidden p-4 border-b border-brand-border bg-black/50 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between">
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="p-2 hover:bg-white/10 rounded-lg"
            aria-label="Open Sidebar Menu"
          >
            <Menu size={20} />
          </button>
          <div className="text-[10px] font-black tracking-[0.3em] uppercase">No Cap Dictionary</div>
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0">
            <span className="text-black font-black text-sm italic">Z</span>
          </div>
        </nav>

        {/* Mobile Global Search Bar */}
        <div className="lg:hidden p-4 border-b border-brand-border bg-black/30 backdrop-blur-md relative z-50">
          <div className="relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dictionary..."
              className="w-full bg-brand-gray/50 border border-brand-border rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-brand-accent transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full"
              >
                <X size={14} className="text-white/40" />
              </button>
            )}
          </div>

          {/* Search Results Expansion */}
          <AnimatePresence>
            {searchQuery && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute left-4 right-4 top-full mt-2 bg-brand-gray border border-brand-accent rounded-xl shadow-2xl overflow-hidden max-h-[60vh] flex flex-col z-[100]"
              >
                <div className="p-3 border-b border-brand-border bg-black/40 flex justify-between items-center">
                  <span className="text-[9px] uppercase font-black tracking-widest text-white/40">Results ({filteredSlangs.length})</span>
                </div>
                <div className="overflow-y-auto flex-1 custom-scrollbar">
                  {filteredSlangs.length > 0 ? (
                    filteredSlangs.map((slang) => (
                      <button
                        key={slang.id}
                        onClick={() => {
                          setSelectedSlangId(slang.id);
                          setSearchQuery('');
                        }}
                        aria-label={`View details for ${slang.term}`}
                        className="w-full text-left p-4 hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors flex justify-between items-center group"
                      >
                        <div>
                          <p className="font-black text-sm group-hover:text-brand-accent transition-colors">{slang.term}</p>
                          <p className="text-xs text-white/40 truncate max-w-[200px]">{slang.meaning}</p>
                        </div>
                        <span className="text-[10px] text-white/20 font-bold uppercase">{slang.category}</span>
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center text-white/20">
                      <p className="text-xs italic">No results found for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="detail-skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 p-12 md:p-20 space-y-12"
            >
              <div className="space-y-4">
                <Skeleton width="100px" height="0.75rem" />
                <Skeleton width="60%" height="4rem" />
              </div>
              <div className="space-y-6">
                <Skeleton width="100%" height="2rem" />
                <Skeleton width="90%" height="2rem" />
                <Skeleton width="40%" height="2rem" />
              </div>
              <div className="pt-12 space-y-4">
                <Skeleton width="120px" height="1rem" />
                <Skeleton width="100%" height="8rem" />
              </div>
            </motion.div>
          ) : selectedSlang ? (
            <motion.div
              key={selectedSlang.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col w-full"
            >
              <SlangDetail slang={selectedSlang} />

              {/* Bottom Info Bar */}
              <div className="mt-auto p-8 md:p-12 border-t border-brand-border flex flex-col md:flex-row gap-8 justify-between items-center bg-black">
                <div className="flex gap-8 md:gap-12 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                  <div className="flex flex-col gap-1 shrink-0">
                    <span className="text-[9px] text-white/20 uppercase font-black tracking-widest">Protocol</span>
                    <span className="text-xs font-bold uppercase">GenZ Translation 1.0</span>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <span className="text-[9px] text-white/20 uppercase font-black tracking-widest">Safety Status</span>
                    <span className="text-xs font-bold text-green-500 uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Cap-Free
                    </span>
                  </div>
                </div>

                <div className="flex gap-4 w-full md:w-auto justify-center">
                   <button 
                     onClick={() => {
                       const idx = slangs.findIndex(s => s.id === selectedSlangId);
                       const prev = slangs[idx - 1] || slangs[slangs.length - 1];
                       setSelectedSlangId(prev.id);
                     }}
                     aria-label="Previous Slang"
                     className="w-12 h-12 border border-brand-accent rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all active:scale-95"
                   >
                     ←
                   </button>
                   <button 
                     onClick={() => {
                        const idx = slangs.findIndex(s => s.id === selectedSlangId);
                        const next = slangs[idx + 1] || slangs[0];
                        setSelectedSlangId(next.id);
                     }}
                     aria-label="Next Slang"
                     className="w-12 h-12 border border-brand-accent rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all active:scale-95"
                   >
                     →
                   </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex items-center justify-center p-20 text-center">
              <div className="space-y-4 max-w-sm">
                <div className="text-4xl">🔌</div>
                <h2 className="text-2xl font-bold uppercase italic">Connection Lost</h2>
                <p className="text-white/40 text-sm">Select a slang from the directory to start decoding the abyss.</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Import Modal */}
      <AnimatePresence>
        {isImporting && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsImporting(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-brand-gray border border-brand-border rounded-3xl p-10 shadow-2xl"
            >
              <button 
                onClick={() => setIsImporting(false)}
                className="absolute top-8 right-8 p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>

              <div className="space-y-8">
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-white text-black rounded-xl flex items-center justify-center mb-6">
                    <Upload size={24} />
                  </div>
                  <h3 className="text-4xl font-black italic uppercase tracking-tighter">Bulk Import</h3>
                  <p className="text-white/40 text-sm leading-relaxed">Expand the directory with your own dataset. Follow the protocol below for successful extraction.</p>
                </div>

                <div className="bg-black/50 p-5 rounded-2xl border border-brand-accent space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
                    <Info size={12} />
                    <span>Protocol schema</span>
                  </div>
                  <code className="block text-[11px] text-white/70 overflow-x-auto whitespace-nowrap bg-brand-gray p-3 rounded-lg border border-white/5">
                    term, meaning, millennialTranslation, example, category
                  </code>
                </div>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-brand-accent rounded-2xl p-12 text-center space-y-4 hover:border-white/20 hover:bg-white/[0.02] transition-all cursor-pointer group"
                >
                  <div className="mx-auto w-16 h-16 bg-white/5 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all">
                    <Upload size={32} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold uppercase tracking-[0.2em] text-[10px]">Initialize Upload</p>
                    <p className="text-[10px] text-white/30 uppercase font-mono">Format: .csv</p>
                  </div>
                  <input 
                    type="file" 
                    accept=".csv" 
                    onChange={handleFileUpload}
                    className="hidden" 
                    ref={fileInputRef}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

