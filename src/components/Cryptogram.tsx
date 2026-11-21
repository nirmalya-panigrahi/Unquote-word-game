
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Quote } from '../data/quotes';
import { SubstitutionMap, encryptText, calculateDifficulty } from '../lib/crypto';

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
  
  const gridRef = useRef<HTMLDivElement>(null);

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

  // Keep real keyboard focus in sync with the highlighted cell so typing advances
  useEffect(() => {
    if (!activeCell) return;
    const el = gridRef.current?.querySelector<HTMLInputElement>(`[data-idx="${activeCell.index}"]`);
    if (el && document.activeElement !== el) el.focus();
  }, [activeCell?.index]);

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

  const toolBtn =
    'px-4 md:px-6 py-2 border text-[10px] md:text-[11px] uppercase font-semibold tracking-[0.2em] transition-colors';
  const filledCount = Object.keys(guesses).filter(k => !guesses[k].isPencil).length;
  const progress = Math.min(100, (filledCount / 26) * 100);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 md:gap-12 min-h-full">
      {/* HUD */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-ink/15">
        <div className="flex gap-8 md:gap-14">
          <div className="flex flex-col">
            <p className="text-[10px] md:text-[11px] uppercase font-semibold tracking-[0.25em] text-ink/55 mb-1">Difficulty</p>
            <p className="text-base md:text-xl font-serif italic">
              {difficulty.label}{' '}
              <span className="hidden sm:inline text-xs text-ink/45 font-sans tracking-widest not-italic">
                ({difficulty.score.toFixed(1)})
              </span>
            </p>
          </div>
          <div className="hidden sm:flex flex-col">
            <p className="text-[11px] uppercase font-semibold tracking-[0.25em] text-ink/55 mb-1">Frequency</p>
            <p className="text-xl font-serif italic">{difficulty.bias.split(' ')[0]}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowMistakes(true);
              setTimeout(() => setShowMistakes(false), 2000);
            }}
            className={`${toolBtn} border-ink/25 text-ink/70 hover:border-ink hover:text-ink`}
          >
            Check
          </button>
          <button
            onClick={() => setIsPencilMode(!isPencilMode)}
            className={`${toolBtn} ${
              isPencilMode ? 'bg-ink text-paper border-ink' : 'border-ink/25 text-ink/70 hover:border-ink hover:text-ink'
            }`}
          >
            Pencil
          </button>
          <button
            onClick={getHint}
            className={`${toolBtn} border-ink/25 text-ink/70 hover:border-accent hover:text-accent`}
          >
            Hint
          </button>
        </div>
      </div>

      {/* Quote grid */}
      <div ref={gridRef} className="flex flex-wrap gap-x-6 md:gap-x-10 gap-y-12 md:gap-y-16 justify-center items-end mx-auto py-6">
        {encryptedWords.map((word, wordIdx) => {
          const charOffset = encryptedWords.slice(0, wordIdx).join(' ').length + (wordIdx > 0 ? 1 : 0);

          return (
            <motion.div
              key={wordIdx}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: wordIdx * 0.05 }}
              className="flex gap-2"
            >
              {word.split('').map((cipherChar, charIdx) => {
                const globalIdx = charOffset + charIdx;
                const isLetter = /[A-Z]/.test(cipherChar);
                const guess = guesses[cipherChar];
                const isActive = activeCell?.index === globalIdx;
                const sameCipher = activeCell?.cipher === cipherChar;
                const hasConflict = guess && !guess.isPencil && Object.keys(conflicts).includes(guess.char);
                const isWrong = showMistakes && guess && !guess.isPencil && guess.char !== reverseMap[cipherChar];

                if (!isLetter) {
                  return (
                    <div
                      key={charIdx}
                      className="w-4 md:w-6 h-10 md:h-14 flex items-center justify-center text-xl md:text-3xl font-serif text-ink/50 pb-2 md:pb-4"
                    >
                      {cipherChar}
                    </div>
                  );
                }

                let cell = 'border-ink/25 text-ink hover:border-ink';
                if (sameCipher) cell = 'border-accent/50 text-ink bg-accent/10';
                if (isActive) cell = 'border-accent text-accent bg-accent/10';
                if (guess?.isPencil) cell += ' italic !text-ink/40 font-light';
                else cell += ' font-medium';
                if (hasConflict || isWrong) cell = 'border-accent bg-accent text-paper font-medium';

                return (
                  <div key={charIdx} className="flex flex-col items-center gap-2 md:gap-3">
                    <input
                      type="text"
                      maxLength={1}
                      value={guess?.char || ''}
                      readOnly
                      data-idx={globalIdx}
                      onFocus={() => setActiveCell({ cipher: cipherChar, index: globalIdx })}
                      onKeyDown={e => handleKeyPress(cipherChar, e.key)}
                      className={`w-8 md:w-12 h-10 md:h-14 text-center text-xl md:text-3xl font-serif border-b-2 outline-none cursor-pointer transition-colors uppercase bg-transparent ${cell}`}
                    />
                    <div
                      className={`text-[10px] md:text-xs font-mono uppercase transition-colors ${
                        sameCipher ? 'text-accent font-bold' : 'text-ink/45'
                      }`}
                    >
                      {cipherChar}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          );
        })}
      </div>

      {/* Ledger + keyboard */}
      <footer className="mt-auto bg-ink text-paper p-6 md:p-8 -mx-6 md:-mx-10">
        <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
          <div className="flex justify-between items-center">
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.3em] text-paper/60 font-mono">Ledger</span>
            <div className="flex items-center gap-4 md:gap-6">
              {Object.keys(conflicts).length > 0 && (
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Conflict</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="h-1 w-24 md:w-48 bg-paper/15 overflow-hidden">
                  <div className="h-full bg-accent transition-all duration-700" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-[10px] md:text-[11px] font-bold font-mono leading-none">{progress.toFixed(0)}%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-13 gap-1">
            {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => {
              const assignedCipher = (Object.entries(guesses) as [string, Guess][]).find(
                ([, p]) => !p.isPencil && p.char === letter
              )?.[0];
              const isGuessed = !!assignedCipher;
              const isActivePlain = activeCell && guesses[activeCell.cipher]?.char === letter;

              return (
                <div
                  key={letter}
                  className={`flex flex-col items-center py-1.5 md:py-2 px-1 border-b transition-all ${
                    isGuessed ? 'bg-accent text-paper border-accent' : 'border-paper/10 opacity-45'
                  } ${isActivePlain ? 'ring-2 ring-paper ring-offset-2 ring-offset-ink scale-110 z-10 !opacity-100' : ''}`}
                >
                  <span className="text-[8px] font-mono font-bold uppercase mb-1 opacity-70">{letter}</span>
                  <span className="text-xs font-bold font-mono">{assignedCipher || '—'}</span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap justify-center gap-1 md:gap-2 max-w-4xl mx-auto pt-4 md:pt-6 border-t border-paper/15">
            {['Q','W','E','R','T','Y','U','I','O','P','⌫','A','S','D','F','G','H','J','K','L','Z','X','C','V','B','N','M'].map(key => (
              <button
                key={key}
                onMouseDown={e => {
                  e.preventDefault();
                  if (activeCell) handleKeyPress(activeCell.cipher, key === '⌫' ? 'BACKSPACE' : key);
                }}
                className={`px-2 md:px-3 py-1.5 md:py-2 border text-[11px] md:text-xs font-mono transition-colors uppercase min-w-[1.8rem] md:min-w-[2.5rem] ${
                  key === '⌫' ? 'bg-paper/10 border-paper/25' : 'border-paper/15 hover:bg-paper/10'
                }`}
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
