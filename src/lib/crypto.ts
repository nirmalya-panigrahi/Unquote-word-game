
export type SubstitutionMap = Record<string, string>;

/**
 * Generates a substitution cipher key (A-Z)
 * Enforces "No-Self" constraint: A never maps to A.
 */
export function generateSubstitutionKey(): SubstitutionMap {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  let shuffled: string[] = [];

  while (true) {
    shuffled = [...alphabet].sort(() => Math.random() - 0.5);
    
    // Check for self-mapping
    let hasSelfMapping = false;
    for (let i = 0; i < alphabet.length; i++) {
      if (alphabet[i] === shuffled[i]) {
        hasSelfMapping = true;
        break;
      }
    }

    if (!hasSelfMapping) break;
  }

  const map: SubstitutionMap = {};
  alphabet.forEach((letter, i) => {
    map[letter] = shuffled[i];
  });

  return map;
}

/**
 * Encrypts a text using a substitution map, preserving non-alphabet characters.
 */
export function encryptText(text: string, map: SubstitutionMap): string {
  return text.toUpperCase().split("").map(char => {
    if (/[A-Z]/.test(char)) {
      return map[char] || char;
    }
    return char;
  }).join("");
}

/**
 * Calculates difficulty based on length, unique letters, and entropy.
 * Score range: ~0 (easy) to 100 (hard)
 */
export function calculateDifficulty(text: string): { score: number; label: 'Easy' | 'Medium' | 'Hard' | 'Expert'; bias: string } {
  const letters = text.toUpperCase().replace(/[^A-Z]/g, "");
  const uniqueCount = new Set(letters).size;
  const length = letters.length;

  if (length === 0) return { score: 1.0, label: 'Easy', bias: 'Neutral' };

  // Difficulty factors:
  // 1. Length penalty (Shorter is harder - max 4.0 points)
  // Most quotes are 20-200 chars. Let's say < 40 is "Hard" territory.
  const lengthFactor = Math.max(0, 150 - length) / 30; 
  
  // 2. Unique letters ratio (Fewer unique letters relative to length can be easier, 
  // but overall fewer options is usually harder. Max 3.0 points)
  const uniqueFactor = (26 - uniqueCount) / 5;
  
  // 3. Frequency Deviation (Max 3.0 points)
  const frequencies: Record<string, number> = {};
  for (const l of letters) frequencies[l] = (frequencies[l] || 0) + 1;
  const sorted = Object.entries(frequencies).sort((a, b) => b[1] - a[1]);
  const mostCommon = sorted[0]?.[0];
  
  let frequencyFactor = 0;
  let bias = "Neutral";
  
  if (mostCommon) {
    if (mostCommon === 'E') {
      frequencyFactor = 0;
      bias = "E-Dominant (Standard)";
    } else if (['T', 'A', 'O', 'I', 'N'].includes(mostCommon)) {
      frequencyFactor = 1.0;
      bias = "Neutral-Common";
    } else {
      frequencyFactor = 3.0;
      bias = "Uncommon-Heavy";
    }
  }

  const rawScore = Math.min(10, Math.max(1, lengthFactor + uniqueFactor + frequencyFactor));
  const score = Math.round(rawScore * 10) / 10;
  
  let label: 'Easy' | 'Medium' | 'Hard' | 'Expert' = 'Easy';
  if (score > 8.0) label = 'Expert';
  else if (score > 5.5) label = 'Hard';
  else if (score > 3.0) label = 'Medium';

  return { score, label, bias };
}
