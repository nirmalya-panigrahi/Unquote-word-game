import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QUOTES } from './data/quotes';
import { generateSubstitutionKey, calculateDifficulty } from './lib/crypto';
import Cryptogram from './components/Cryptogram';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const label = 'text-[10px] md:text-[11px] uppercase tracking-[0.25em] font-semibold text-ink/55';
const outlineBtn =
  'flex-1 xs:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border border-ink/25 text-[10px] md:text-[11px] font-semibold uppercase tracking-widest hover:border-ink transition-colors disabled:opacity-30 disabled:hover:border-ink/25';

export default function App() {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [showTrivia, setShowTrivia] = useState(false);
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('cryptex_unlocked');
      return saved ? JSON.parse(saved) : [0];
    } catch {
      return [0];
    }
  });

  const sortedQuotes = useMemo(() => {
    return [...QUOTES].sort((a, b) => calculateDifficulty(a.text).score - calculateDifficulty(b.text).score);
  }, []);

  const quote = useMemo(() => sortedQuotes[currentLevel % sortedQuotes.length], [currentLevel, sortedQuotes]);
  const cipherMap = useMemo(() => generateSubstitutionKey(), [currentLevel]);

  const handleLevelComplete = () => {
    setShowTrivia(true);
    if (!unlockedLevels.includes(currentLevel + 1) && currentLevel + 1 < QUOTES.length) {
      const newUnlocked = [...unlockedLevels, currentLevel + 1];
      setUnlockedLevels(newUnlocked);
      try {
        localStorage.setItem('cryptex_unlocked', JSON.stringify(newUnlocked));
      } catch {}
    }
  };

  const nextLevel = () => {
    setShowTrivia(false);
    setCurrentLevel(prev => (prev + 1) % QUOTES.length);
  };

  const solvedCount = Math.max(0, unlockedLevels.length - 1);
  const canGoNext = unlockedLevels.includes(currentLevel + 1);

  /* ───────────── Start screen ───────────── */
  if (!isGameStarted) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full space-y-14 text-center"
        >
          <div className="flex flex-col items-center">
            <span className={label}>The Archive Presents</span>
            <div className="w-12 md:w-16 h-px bg-ink/25 mt-3 mb-8" />

            <h1 className="relative text-6xl md:text-8xl font-serif italic tracking-tighter">
              <span className="text-accent">“</span>Unquote<span className="text-accent">”</span>
            </h1>

            <p className="mt-6 text-lg md:text-xl text-ink/60 font-serif italic max-w-sm px-4">
              Archival cryptograms for the discerning mind.
            </p>
          </div>

          <div className="flex flex-col items-center gap-8">
            <button
              onClick={() => setIsGameStarted(true)}
              className="px-10 md:px-16 py-4 md:py-5 bg-accent text-paper font-serif italic text-xl md:text-2xl hover:bg-ink transition-colors duration-500"
            >
              Enter the Archive
            </button>
            <div className={`flex flex-wrap justify-center items-center gap-3 md:gap-6 ${label}`}>
              <span>{QUOTES.length} Verified Entries</span>
              <span className="hidden xs:block w-1 h-1 bg-ink/30 rounded-full" />
              <span>Progressive Challenge</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ───────────── Game screen ───────────── */
  return (
    <div className="min-h-screen bg-paper flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-end px-6 md:px-10 py-6 md:py-8 border-b border-ink/15">
        <div className="flex flex-col">
          <button
            onClick={() => setIsGameStarted(false)}
            className={`${label} mb-2 hover:text-ink transition-colors flex items-center gap-2 group`}
          >
            <ChevronLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
            <span className="hidden xs:inline">Unquote Archive</span>
            <span className="xs:hidden">Back</span>
          </button>
          <h1 className="text-3xl md:text-5xl font-serif italic tracking-tighter">
            Case <span className="text-accent">#{String(currentLevel + 1).padStart(3, '0')}</span>
          </h1>
        </div>

        <div className="flex gap-8 md:gap-14 text-right">
          <div className="hidden xs:block">
            <p className={`${label} mb-1`}>Index</p>
            <p className="text-sm md:text-base font-serif italic leading-none">
              {currentLevel + 1} / {QUOTES.length}
            </p>
          </div>
          <div>
            <p className={`${label} mb-1`}>Solved</p>
            <p className="text-sm md:text-base font-serif italic leading-none">{solvedCount}</p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-1 overflow-hidden">
        <div className="flex-[3] relative overflow-y-auto p-6 md:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentLevel}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="h-full flex flex-col justify-center"
            >
              <Cryptogram quote={quote} cipherMap={cipherMap} onComplete={handleLevelComplete} />
            </motion.div>
          </AnimatePresence>
        </div>

        <aside className="w-72 border-l border-ink/15 bg-ink/[0.04] p-8 hidden lg:flex flex-col">
          <div className="space-y-4">
            <h3 className={`${label} border-b border-ink/15 pb-2`}>Cipher Rules</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-xs font-serif italic text-ink/65 leading-relaxed">
                <span className="text-accent font-bold not-italic">I.</span> Every cipher letter stands for exactly one plain letter.
              </li>
              <li className="flex items-start gap-2 text-xs font-serif italic text-ink/65 leading-relaxed">
                <span className="text-accent font-bold not-italic">II.</span> No letter ever stands for itself.
              </li>
              <li className="flex items-start gap-2 text-xs font-serif italic text-ink/65 leading-relaxed">
                <span className="text-accent font-bold not-italic">III.</span> Punctuation and spaces stay as they are.
              </li>
            </ul>
          </div>

          <div className="mt-auto pt-8">
            <div className="p-5 border border-ink/15">
              <span className={`${label} block mb-2`}>Field Note</span>
              <p className="text-xs leading-relaxed text-ink/65 font-serif italic">
                A lone one-letter word is almost always <span className="text-accent font-semibold not-italic">A</span> or{' '}
                <span className="text-accent font-semibold not-italic">I</span>.
              </p>
            </div>
          </div>
        </aside>
      </main>

      {/* Navigation */}
      <div className="px-6 md:px-10 border-t border-ink/15 py-4 flex flex-col xs:flex-row justify-between items-center gap-4">
        <div className="flex gap-2 w-full xs:w-auto">
          <button
            onClick={() => setCurrentLevel(Math.max(0, currentLevel - 1))}
            disabled={currentLevel === 0}
            className={outlineBtn}
          >
            <ChevronLeft size={12} /> <span className="hidden sm:inline">Previous</span> Case
          </button>
          <button
            onClick={() => setCurrentLevel(Math.min(QUOTES.length - 1, currentLevel + 1))}
            disabled={!canGoNext}
            className={`${outlineBtn} ${canGoNext ? '!bg-accent !border-accent text-paper hover:!bg-ink hover:!border-ink' : ''}`}
          >
            Next <span className="hidden sm:inline">Case</span> <ChevronRight size={12} />
          </button>
        </div>
        <div className={label}>Archive unlocked: {((solvedCount / QUOTES.length) * 100).toFixed(0)}%</div>
      </div>

      {/* Solved modal */}
      <AnimatePresence>
        {showTrivia && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="max-w-xl w-full bg-paper border border-ink overflow-hidden"
            >
              <div className="border-b border-ink/15 p-8 text-center">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-accent text-paper mb-4">
                  <Check size={18} strokeWidth={3} />
                </span>
                <h2 className="text-3xl md:text-4xl font-serif italic tracking-tight">Decrypted</h2>
              </div>

              <div className="p-6 md:p-10 space-y-8">
                <p className="text-xl md:text-2xl font-serif italic leading-relaxed text-center">
                  “{quote.text}”
                </p>

                <div className="text-center space-y-1">
                  <p className="text-lg md:text-xl font-serif italic text-accent">— {quote.author}</p>
                  {quote.source && <p className="text-xs text-ink/55 font-serif italic">{quote.source}</p>}
                </div>

                <button
                  onClick={nextLevel}
                  className="w-full py-3 md:py-4 bg-ink text-paper font-serif italic text-lg md:text-xl hover:bg-accent transition-colors duration-300"
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
