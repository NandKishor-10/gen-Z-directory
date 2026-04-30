/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Menu, ChevronLeft, RefreshCw } from 'lucide-react';
import { Slang } from './types';
import SlangDetail from './components/SlangCard';
import Skeleton from './components/Skeleton';
import { fetchSlangs } from './lib/supabase';

export default function App() {
  const [slangs, setSlangs] = useState<Slang[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSlangId, setSelectedSlangId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSlangs();
      if (data.length > 0) {
        setSlangs(data);
        // Default selection
        const aura = data.find(s => s.term.toLowerCase() === 'aura');
        setSelectedSlangId(aura?.id || data[0].id);
      } else {
        setError('The database is empty. No slangs to decode.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to sync with the matrix.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
        
        <div className="flex-1 overflow-y-auto w-full px-1 opacity-30 hover:opacity-100 transition-opacity custom-scrollbar no-scrollbar pb-10 scroll-smooth">
          <button 
            onClick={loadData}
            className="w-full py-2 hover:bg-brand-accent rounded mb-2 transition-colors flex items-center justify-center text-white/50 hover:text-white"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
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
          ) : error ? (
            <motion.div
              key="error-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-4 border border-red-500/20">
                <X size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold italic uppercase tracking-tighter text-red-400">Sync Failure</h3>
                <p className="text-white/40 text-sm max-w-xs mx-auto leading-relaxed">{error}</p>
              </div>
              <button 
                onClick={loadData}
                className="px-6 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-brand-accent hover:text-white transition-all transform active:scale-95"
              >
                Retry Link
              </button>
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
                       if (prev) setSelectedSlangId(prev.id);
                     }}
                     aria-label="Previous Slang"
                     className="w-12 h-12 border border-brand-accent rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all active:scale-95 disabled:opacity-20"
                     disabled={slangs.length <= 1}
                   >
                     ←
                   </button>
                   <button 
                     onClick={() => {
                        const idx = slangs.findIndex(s => s.id === selectedSlangId);
                        const next = slangs[idx + 1] || slangs[0];
                        if (next) setSelectedSlangId(next.id);
                     }}
                     aria-label="Next Slang"
                     className="w-12 h-12 border border-brand-accent rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all active:scale-95 disabled:opacity-20"
                     disabled={slangs.length <= 1}
                   >
                     →
                   </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex items-center justify-center p-20 text-center">
              <div className="space-y-4 max-w-sm">
                <div className="text-4xl opacity-50">🔌</div>
                <h2 className="text-2xl font-bold uppercase italic text-white/60">Connection Lost</h2>
                <p className="text-white/30 text-xs">The abyss is silent. Select a transmission or verify the uplink.</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

