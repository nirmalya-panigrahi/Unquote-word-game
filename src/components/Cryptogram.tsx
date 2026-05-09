
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Quote } from '../data/quotes';
import { SubstitutionMap, encryptText, calculateDifficulty } from '../lib/crypto';
import { Info, HelpCircle, RotateCcw, CheckCircle2, ChevronRight, X, Lightbulb } from 'lucide-react';

interface Guess {
  char: string;
  isPencil: boolean;
}

interface CryptogramProps {
  quote: Quote;
  cipherMap: SubstitutionMap;
  onComplete: () => void;
}

export default function Cryptogram({ quote, cipherMap, onComplete }: CryptogramProps) {
  const [guesses, setGuesses] = useState<Record<string, Guess>>({});
  const [isPencilMode, setIsPencilMode] = useState(false);
  const [activeCell, setActiveCell] = useState<{cipher: string, index: number} | null>(null);
  const [showMistakes, setShowMistakes] = useState(false);
  
  const words = useMemo(() => quote.text.split(" "), [quote.text]);
  const encryptedText = useMemo(() => encryptText(quote.text, cipherMap), [quote.text, cipherMap]);
  const encryptedWords = useMemo(() => encryptedText.split(" "), [encryptedText]);
  
  // Flat array of letter positions for navigation
  const letterPositions = useMemo(() => {
    const positions: { cipher: string, index: number }[] = [];
    encryptedText.split("").forEach((char, i) => {
      if (/[A-Z]/.test(char)) {
        positions.push({ cipher: char, index: i });
      }
    });
    return positions;
  }, [encryptedText]);

  // Reverse map for validation
  const reverseMap = useMemo(() => {
    const rev: Record<string, string> = {};
    Object.entries(cipherMap).forEach(([plain, cipher]) => {
      rev[cipher] = plain;
    });
    return rev;
  }, [cipherMap]);

  // Difficulty
  const difficulty = useMemo(() => calculateDifficulty(quote.text), [quote.text]);

  // Conflicts
  const conflicts = useMemo(() => {
    const map: Record<string, string[]> = {};
    (Object.entries(guesses) as [string, Guess][]).forEach(([cipher, guess]) => {
      if (!guess.isPencil) {
        if (!map[guess.char]) map[guess.char] = [];
        map[guess.char].push(cipher);
      }
    });
    return Object.fromEntries(Object.entries(map).filter(([_, ciphers]) => ciphers.length > 1));
  }, [guesses]);

  // Check completion
  useEffect(() => {
    const letters = encryptedText.replace(/[^A-Z]/g, "");
    if (letters.length === 0) return;

    const isAllCorrect = letters.split("").every(cipherChar => {
      const g = guesses[cipherChar];
      return g && !g.isPencil && g.char === reverseMap[cipherChar];
    });

    if (isAllCorrect) {
      onComplete();
    }
  }, [guesses, encryptedText, reverseMap, onComplete]);

  const navigate = (direction: 'next' | 'prev') => {
    if (!activeCell) return;
    const currentIdx = letterPositions.findIndex(p => p.index === activeCell.index);
    let nextIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
    
    if (nextIdx >= letterPositions.length) nextIdx = 0;
    if (nextIdx < 0) nextIdx = letterPositions.length - 1;
    
    setActiveCell(letterPositions[nextIdx]);
  };

  const handleKeyPress = (cipherChar: string, key: string) => {
    const upperKey = key.toUpperCase();
    
    if (upperKey === 'ARROWLEFT') {
      navigate('prev');
      return;
    }
    if (upperKey === 'ARROWRIGHT' || upperKey === ' ') {
      navigate('next');
      return;
    }

    if (!/[A-Z]/.test(cipherChar)) return;

    if (upperKey === 'BACKSPACE' || upperKey === 'DELETE') {
      setGuesses(prev => {
        const next = { ...prev };
        delete next[cipherChar];
        return next;
      });
      // Optionally move back if empty
      if (!guesses[cipherChar]) navigate('prev');
      return;
    }

    if (!/^[A-Z]$/.test(upperKey)) return;

    setGuesses(prev => ({
      ...prev,
      [cipherChar]: { char: upperKey, isPencil: isPencilMode }
    }));

    // Auto-advance
    if (!isPencilMode) {
      navigate('next');
    }
  };

  const getHint = () => {
    const unrevealed = Object.keys(reverseMap).filter(cipher => {
      const g = guesses[cipher];
      return !g || g.isPencil || g.char !== reverseMap[cipher];
    });
    if (unrevealed.length === 0) return;
    
    const frequencies: Record<string, number> = {};
    encryptedText.replace(/[^A-Z]/g, "").split("").forEach(c => {
      if (unrevealed.includes(c)) frequencies[c] = (frequencies[c] || 0) + 1;
    });
    const sorted = Object.entries(frequencies).sort((a, b) => b[1] - a[1]);
    const targetCipher = sorted[0]?.[0] || unrevealed[0];

    setGuesses(prev => ({
      ...prev,
      [targetCipher]: { char: reverseMap[targetCipher], isPencil: false }
    }));
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 md:gap-12 min-h-full">
      {/* HUD - Minimalist Editorial */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-editorial-border/30">
        <div className="flex gap-6 md:gap-16">
          <div className="flex flex-col">
            <p className="text-[9px] md:text-[10px] uppercase font-bold tracking-[0.2em] text-editorial-muted mb-1 italic">Difficulty Score</p>
            <p className="text-sm md:text-xl font-serif italic text-editorial-text">{difficulty.label} <span className="hidden sm:inline text-xs opacity-50 font-sans tracking-widest not-italic">({difficulty.score.toFixed(1)})</span></p>
          </div>
          <div className="hidden sm:flex flex-col">
            <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-editorial-muted mb-1 italic">Frequency Mapping</p>
            <p className="text-xl font-serif italic text-editorial-text">{difficulty.bias.split(" ")[0]}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setShowMistakes(true);
              setTimeout(() => setShowMistakes(false), 2000);
            }}
            className="px-3 md:px-6 py-1.5 md:py-2 border border-editorial-border text-[9px] md:text-[10px] uppercase font-bold tracking-[0.2em] text-editorial-muted hover:border-editorial-text hover:text-editorial-text transition-colors"
          >
            Check
          </button>
          <button 
            onClick={() => setIsPencilMode(!isPencilMode)}
            className={`px-3 md:px-6 py-1.5 md:py-2 border text-[9px] md:text-[10px] uppercase font-bold tracking-[0.2em] transition-all ${
              isPencilMode 
                ? 'bg-editorial-text text-white border-editorial-text font-bold' 
                : 'border-editorial-border text-editorial-muted hover:border-editorial-text'
            }`}
          >
            Pencil
          </button>
          <button 
            onClick={getHint}
            className="px-3 md:px-6 py-1.5 md:py-2 border border-editorial-border text-[9px] md:text-[10px] uppercase font-bold tracking-[0.2em] text-editorial-muted hover:border-editorial-text hover:text-editorial-text transition-colors"
          >
            Hint
          </button>
        </div>
      </div>

      {/* Quote Grid */}
      <div className="flex flex-wrap gap-x-6 md:gap-x-10 gap-y-12 md:gap-y-16 justify-center items-end mx-auto py-8">
        {encryptedWords.map((word, wordIdx) => {
          let charOffset = encryptedWords.slice(0, wordIdx).join(" ").length + (wordIdx > 0 ? 1 : 0);
          
          return (
            <motion.div 
              key={wordIdx} 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: wordIdx * 0.05 }}
              className="flex gap-2"
            >
              {word.split("").map((cipherChar, charIdx) => {
                const globalIdx = charOffset + charIdx;
                const isLetter = /[A-Z]/.test(cipherChar);
                const guess = guesses[cipherChar];
                const isActive = activeCell?.index === globalIdx;
                const sameCipher = activeCell?.cipher === cipherChar;
                const hasConflict = guess && !guess.isPencil && Object.keys(conflicts).includes(guess.char);
                const isWrong = showMistakes && guess && !guess.isPencil && guess.char !== reverseMap[cipherChar];

                if (!isLetter) {
                  return (
                    <div key={charIdx} className="w-4 md:w-6 h-10 md:h-14 flex items-center justify-center text-xl md:text-3xl font-serif font-light text-editorial-muted pb-2 md:pb-4">
                      {cipherChar}
                    </div>
                  );
                }

                return (
                  <div 
                    key={charIdx} 
                    className="flex flex-col items-center gap-2 md:gap-3"
                  >
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={1}
                        value={guess?.char || ""}
                        readOnly
                        onFocus={() => setActiveCell({ cipher: cipherChar, index: globalIdx })}
                        onKeyDown={(e) => handleKeyPress(cipherChar, e.key)}
                        className={`w-8 md:w-12 h-10 md:h-14 text-center text-xl md:text-3xl font-serif border-b-2 outline-none cursor-pointer transition-all uppercase
                          ${isActive ? 'border-editorial-text text-indigo-600 bg-indigo-50/30' : sameCipher ? 'border-editorial-text/40 bg-indigo-50/10' : 'border-editorial-border text-editorial-text'}
                          ${hasConflict ? 'border-red-500 text-red-500 underline underline-offset-8' : ''}
                          ${isWrong ? 'border-red-300 text-red-400 italic' : ''}
                          ${guess?.isPencil ? 'italic text-editorial-muted opacity-40 font-light' : 'font-medium'}
                          hover:border-editorial-text
                        `}
                      />
                    </div>
                    <div className={`text-[9px] md:text-xs font-mono tracking-tighter uppercase transition-colors ${sameCipher ? 'text-indigo-600 font-bold' : 'text-editorial-muted'}`}>
                      {cipherChar}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          );
        })}
      </div>

      {/* Virtual Keyboard / Mapping Footer */}
      <footer className="mt-auto bg-editorial-text text-editorial-bg p-6 md:p-8 -mx-4 md:-mx-10 border-t-8 border-white shadow-2xl">
        <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] opacity-60 font-mono">Ledger</span>
            <div className="flex items-center gap-4 md:gap-6">
              {/* Conflict Indicators */}
              {Object.keys(conflicts).length > 0 && (
                <div className="hidden sm:flex items-center gap-3 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">
                    Conflict Detected
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 md:gap-4">
                <div className="h-1 w-24 md:w-48 bg-white/10 rounded overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 transition-all duration-1000" 
                    style={{ width: `${(Object.keys(guesses).filter(k => !guesses[k].isPencil).length / 26) * 100}%` }}
                  />
                </div>
                <span className="text-[9px] md:text-[10px] font-bold font-mono uppercase tracking-widest leading-none">
                  {((Object.keys(guesses).filter(k => !guesses[k].isPencil).length / 26) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-13 gap-1">
            {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(letter => {
              const assignedCipher = (Object.entries(guesses) as [string, Guess][]).find(([, p]) => {
                return !p.isPencil && p.char === letter;
              })?.[0];
              const isGuessed = !!assignedCipher;
              const isActivePlain = activeCell && (guesses[activeCell.cipher]?.char === letter);
              
              return (
                <div 
                  key={letter}
                  className={`flex flex-col items-center py-1 md:py-2 px-1 border-b transition-all ${
                    isGuessed 
                      ? 'bg-amber-500 text-editorial-text border-amber-600' 
                      : 'border-white/5 opacity-40'
                  } ${isActivePlain ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-editorial-text scale-110 z-10 opacity-100' : ''}`}
                >
                  <span className="text-[7px] font-mono font-bold uppercase mb-1 opacity-60 tracking-tighter">{letter}</span>
                  <span className="text-xs font-bold font-mono">{assignedCipher || "—"}</span>
                </div>
              );
            })}
          </div>
          
          <div className="flex flex-wrap justify-center gap-1 md:gap-2 max-w-4xl mx-auto pt-4 md:pt-6 border-t border-white/10">
            {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '⌫', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Z', 'X', 'C', 'V', 'B', 'N', 'M'].map(key => (
              <button
                key={key}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (activeCell) handleKeyPress(activeCell.cipher, key === '⌫' ? 'BACKSPACE' : key);
                }}
                className={`px-2 md:px-3 py-1.5 md:py-2 border text-[10px] md:text-xs font-mono transition-colors uppercase min-w-[1.8rem] md:min-w-[2.5rem]
                  ${key === '⌫' ? 'bg-white/10 border-white/20' : 'border-white/10 hover:bg-white/10'}
                `}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
