
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QUOTES, Quote } from './data/quotes';
import { generateSubstitutionKey, SubstitutionMap, calculateDifficulty } from './lib/crypto';
import Cryptogram from './components/Cryptogram';
import { Trophy, BookOpen, Quote as QuoteIcon, Settings, Github, Heart, ChevronLeft, ChevronRight, Lock, Play, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [showTrivia, setShowTrivia] = useState(false);
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>(() => {
    const saved = localStorage.getItem('cryptex_unlocked');
    return saved ? JSON.parse(saved) : [0];
  });

  const sortedQuotes = useMemo(() => {
    return [...QUOTES].sort((a, b) => {
      const diffA = calculateDifficulty(a.text).score;
      const diffB = calculateDifficulty(b.text).score;
      return diffA - diffB;
    });
  }, []);

  const quote = useMemo(() => sortedQuotes[currentLevel % sortedQuotes.length], [currentLevel, sortedQuotes]);
  const cipherMap = useMemo(() => generateSubstitutionKey(), [currentLevel]);

  const handleLevelComplete = () => {
    setShowTrivia(true);
    if (!unlockedLevels.includes(currentLevel + 1) && currentLevel + 1 < QUOTES.length) {
      const newUnlocked = [...unlockedLevels, currentLevel + 1];
      setUnlockedLevels(newUnlocked);
      localStorage.setItem('cryptex_unlocked', JSON.stringify(newUnlocked));
    }
  };

  const nextLevel = () => {
    setShowTrivia(false);
    setCurrentLevel(prev => (prev + 1) % QUOTES.length);
  };

  if (!isGameStarted) {
    return (
      <div className="min-h-screen bg-editorial-bg flex flex-col items-center justify-center p-6 border-[12px] border-white shadow-inner">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full space-y-12 text-center"
        >
          <div className="flex flex-col items-center">
            <span className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] font-semibold text-editorial-muted mb-2">The Archive Presents</span>
            <div className="w-12 md:w-16 h-px bg-editorial-border mb-6" />
            
            <div className="relative mb-6">
              <span className="absolute -top-8 -left-8 text-6xl opacity-10 font-serif italic text-editorial-text pointer-events-none select-none">“</span>
              <h1 className="text-6xl md:text-8xl font-serif italic font-light tracking-tighter text-editorial-text z-10 relative">Unquote</h1>
              <span className="absolute -bottom-4 -right-8 text-6xl opacity-10 font-serif italic text-editorial-text pointer-events-none select-none">”</span>
            </div>
            
            <p className="text-lg md:text-xl text-editorial-muted font-serif italic max-w-sm px-4">
              Archival cryptograms for the discerning mind.
            </p>
          </div>

          <div className="flex flex-col items-center gap-6 md:gap-8">
            <button 
              onClick={() => setIsGameStarted(true)}
              className="group relative px-10 md:px-16 py-4 md:py-5 border border-editorial-text text-editorial-text font-serif italic text-xl md:text-2xl hover:bg-editorial-text hover:text-white transition-all duration-700 ease-in-out"
            >
              Enter the Archive
            </button>
            <div className="flex flex-wrap justify-center items-center gap-3 md:gap-6 text-[8px] md:text-[10px] font-bold text-editorial-muted uppercase tracking-[0.3em]">
              <span>{QUOTES.length} Verified Entries</span>
              <div className="hidden xs:block w-1 h-1 bg-editorial-border rounded-full" />
              <span>Progressive Challenge</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-editorial-bg flex flex-col border-[12px] border-white shadow-inner overflow-hidden">
      {/* Header Section */}
      <header className="flex justify-between items-end px-6 md:px-10 py-6 md:py-10 border-b border-editorial-border bg-white/50 backdrop-blur-sm">
        <div className="flex flex-col">
          <button 
            onClick={() => setIsGameStarted(false)}
            className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-bold text-editorial-muted mb-2 hover:text-editorial-text transition-colors flex items-center gap-1 md:gap-2 group"
          >
            <ChevronLeft size={10} className="group-hover:-translate-x-1 transition-transform" />
            <span className="hidden xs:inline">Unquote Archive</span>
            <span className="xs:hidden">Back</span>
          </button>
          <h1 className="text-3xl md:text-5xl font-serif italic font-light tracking-tighter">Case #{String(currentLevel + 1).padStart(3, '0')}</h1>
        </div>
        
        <div className="flex gap-6 md:gap-16 text-right">
          <div className="hidden xs:block">
            <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-editorial-muted mb-1">Index</p>
            <p className="text-xs md:text-sm font-serif italic leading-none">{currentLevel + 1} / {QUOTES.length}</p>
          </div>
          <div>
            <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-editorial-muted mb-1">Solved</p>
            <p className="text-xs md:text-sm font-serif italic leading-none">{unlockedLevels.length - 1}</p>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex flex-1 overflow-hidden">
        {/* Game Area */}
        <div className="flex-[3] relative overflow-y-auto custom-scrollbar p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentLevel}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="h-full flex flex-col justify-center"
            >
              <Cryptogram 
                quote={quote} 
                cipherMap={cipherMap} 
                onComplete={handleLevelComplete}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Sidebar Analysis - Decluttering to only essential info */}
        <aside className="w-72 border-r lg:border-l lg:border-r-0 border-editorial-border bg-editorial-sidebar p-8 flex flex-col hidden lg:flex">
          <div className="space-y-12">
            <div className="space-y-4">
              <h3 className="text-[10px] uppercase tracking-[0.3em] text-editorial-muted font-bold border-b border-editorial-border pb-2 italic">Cipher Rules</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-[10px] font-serif italic text-editorial-muted leading-relaxed">
                  <span className="text-editorial-text font-bold">I.</span> Every unique symbol maps to exactly one letter.
                </li>
                <li className="flex items-start gap-2 text-[10px] font-serif italic text-editorial-muted leading-relaxed">
                  <span className="text-editorial-text font-bold">II.</span> Punctuation and spaces remain static.
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-auto pt-8 space-y-4">
            <div className="p-5 border border-editorial-border bg-editorial-card shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={12} className="text-green-600" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-green-800">Archival Accuracy</span>
              </div>
              <p className="text-[10px] leading-normal text-editorial-muted font-serif italic">
                Source vetted via Primary Historical Text matching.
              </p>
            </div>
          </div>
        </aside>
      </main>

      {/* Navigation Controls */}
      <div className="px-6 md:px-10 border-t border-editorial-border py-4 bg-white/50 flex flex-col xs:flex-row justify-between items-center gap-4">
        <div className="flex gap-2 w-full xs:w-auto">
          <button 
            onClick={() => setCurrentLevel(Math.max(0, currentLevel - 1))}
            disabled={currentLevel === 0}
            className="flex-1 xs:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 border border-editorial-border text-[9px] md:text-[10px] font-bold uppercase tracking-widest hover:bg-editorial-sidebar transition-colors disabled:opacity-30"
          >
            <ChevronLeft size={10} /> <span className="hidden sm:inline">Previous</span> Case
          </button>
          <button 
            onClick={() => setCurrentLevel(Math.min(QUOTES.length - 1, currentLevel + 1))}
            disabled={!unlockedLevels.includes(currentLevel + 1)}
            className="flex-1 xs:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 border border-editorial-border text-[9px] md:text-[10px] font-bold uppercase tracking-widest hover:bg-editorial-sidebar transition-colors disabled:opacity-30"
          >
            Next <span className="hidden sm:inline">Case</span> <ChevronRight size={10} />
          </button>
        </div>
        <div className="text-[9px] md:text-[10px] font-bold text-editorial-muted uppercase tracking-[0.2em] italic">
          Database synchronization: {((unlockedLevels.length - 1) / QUOTES.length * 100).toFixed(0)}%
        </div>
      </div>

      {/* Trivia Modal */}
      <AnimatePresence>
        {showTrivia && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-editorial-text/20 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="max-w-xl w-full bg-editorial-bg border-[8px] border-white shadow-2xl overflow-hidden"
            >
              <div className="border-b border-editorial-border p-8 text-center bg-white/50 relative">
                <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase tracking-widest">
                  <CheckCircle2 size={12} /> Verified
                </div>
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-editorial-muted block mb-2">Record Synchronized</span>
                <h2 className="text-3xl md:text-4xl font-serif italic font-light tracking-tight">Decryption Successful</h2>
              </div>

              <div className="p-6 md:p-10 space-y-6 md:space-y-8">
                <div className="space-y-6">
                  <div className="p-6 md:p-8 bg-editorial-sidebar border border-editorial-border relative">
                    <QuoteIcon className="absolute -top-3 left-4 text-editorial-border opacity-50" size={24} />
                    <p className="text-xl md:text-2xl font-serif italic text-editorial-text tracking-tight leading-relaxed text-center">
                      "{quote.text}"
                    </p>
                  </div>
                  <div className="text-center space-y-2">
                    <span className="text-[10px] font-bold text-editorial-muted uppercase tracking-widest block">Attributed to</span>
                    <p className="text-xl md:text-2xl font-serif italic font-medium text-editorial-text leading-none">{quote.author}</p>
                    {quote.source && <p className="text-xs text-editorial-muted font-serif italic opacity-70">{quote.source}</p>}
                  </div>
                </div>

                <div className="w-full h-px bg-editorial-border" />
                
                <div className="bg-editorial-sidebar p-4 border border-editorial-border/50 text-[9px] md:text-[10px] font-serif italic text-editorial-muted leading-relaxed">
                  Historical Context: This quote, verified from archival sources, exemplifies the perspective of {quote.author} and has been preserved for its philosophical significance.
                </div>

                <button 
                  onClick={nextLevel}
                  className="w-full py-3 md:py-4 border border-editorial-text text-editorial-text font-serif italic text-lg md:text-xl hover:bg-editorial-text hover:text-white transition-all duration-500"
                >
                  Proceed to Next Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
