import { FIVE_LETTER_WORDS, isValidWord, getRandomFiveLetterWords } from '@/services/word-dictionary';
import { isValidItalianWord, getRandomItalianWord } from '@/services/italian-dictionary';

export type Language = 'en' | 'it';

export const WORD_LENGTH = 5;
export const MAX_ATTEMPTS = 6;

// Scoring system (like arcade games - score starts at 0 and increases)
export const POINTS_CORRECT = 100;    // Green letter (correct position)
export const POINTS_PRESENT = 50;     // Yellow letter (wrong position)
export const POINTS_WIN_BONUS = 500;  // Bonus for winning
export const POINTS_SPEED_BONUS = 100; // Bonus per attempt left when winning
export const HINT_PENALTY = 50;       // Penalty per hint used

export type LetterStatus = 'correct' | 'present' | 'absent' | 'empty' | 'hint';

export interface LetterResult {
  letter: string;
  status: LetterStatus;
}

export interface GuessResult {
  word: string;
  letters: LetterResult[];
}

export interface GameState {
  targetWord: string;
  guesses: GuessResult[];
  currentGuess: string;
  gameStatus: 'playing' | 'won' | 'lost';
  usedLetters: Map<string, LetterStatus>;
  attemptsLeft: number;
  score: number;
  hintsUsed: number;
  revealedPositions: number[]; // Positions revealed by hints
  language: Language;
}

// Keyboard layout
export const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL'],
];

// Get a random word from the dictionary based on language
function getRandomWord(language: Language): string {
  if (language === 'it') {
    return getRandomItalianWord();
  }
  const words = getRandomFiveLetterWords(1);
  return words[0] || 'GREAT';
}

// Check if word is valid based on language
function isWordValid(word: string, language: Language): boolean {
  if (language === 'it') {
    return isValidItalianWord(word);
  }
  return isValidWord(word);
}

// Initialize a new game
export function initializeGame(language: Language = 'en'): GameState {
  return {
    targetWord: getRandomWord(language),
    guesses: [],
    currentGuess: '',
    gameStatus: 'playing',
    usedLetters: new Map(),
    attemptsLeft: MAX_ATTEMPTS,
    score: 0,
    hintsUsed: 0,
    revealedPositions: [],
    language,
  };
}

// Calculate score for a guess result
function calculateGuessScore(results: LetterResult[]): number {
  let score = 0;
  for (const result of results) {
    if (result.status === 'correct' || result.status === 'hint') {
      score += POINTS_CORRECT;
    } else if (result.status === 'present') {
      score += POINTS_PRESENT;
    }
  }
  return score;
}

// Evaluate a guess against the target word
export function evaluateGuess(guess: string, target: string, revealedPositions: number[]): LetterResult[] {
  const results: LetterResult[] = [];
  const targetLetters = target.split('');
  const guessLetters = guess.split('');
  const usedTargetIndices = new Set<number>();

  // First pass: mark correct letters (and hints)
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessLetters[i] === targetLetters[i]) {
      results[i] = {
        letter: guessLetters[i],
        status: revealedPositions.includes(i) ? 'hint' : 'correct',
      };
      usedTargetIndices.add(i);
    }
  }

  // Second pass: mark present or absent
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (results[i]) continue;

    const letter = guessLetters[i];
    let found = false;

    for (let j = 0; j < WORD_LENGTH; j++) {
      if (!usedTargetIndices.has(j) && targetLetters[j] === letter) {
        results[i] = { letter, status: 'present' };
        usedTargetIndices.add(j);
        found = true;
        break;
      }
    }

    if (!found) {
      results[i] = { letter, status: 'absent' };
    }
  }

  return results;
}

// Submit a guess
export function submitGuess(
  state: GameState,
  guess: string
): GameState | { error: string } {
  if (guess.length !== WORD_LENGTH) {
    return { error: 'Enter 5 letters' };
  }

  if (!isWordValid(guess, state.language)) {
    return { error: 'Word not in dictionary' };
  }

  const results = evaluateGuess(guess, state.targetWord, state.revealedPositions);
  const newGuess: GuessResult = { word: guess, letters: results };

  // Update used letters map
  const newUsedLetters = new Map(state.usedLetters);
  for (const result of results) {
    const currentStatus = newUsedLetters.get(result.letter);
    // Priority: correct/hint > present > absent
    if (result.status === 'correct' || result.status === 'hint') {
      newUsedLetters.set(result.letter, 'correct');
    } else if (result.status === 'present' && currentStatus !== 'correct') {
      newUsedLetters.set(result.letter, 'present');
    } else if (!currentStatus) {
      newUsedLetters.set(result.letter, result.status);
    }
  }

  // Calculate score for this guess
  const guessScore = calculateGuessScore(results);
  const newScore = state.score + guessScore;

  // Check if won
  const isCorrect = results.every(r => r.status === 'correct' || r.status === 'hint');
  const newAttemptsLeft = state.attemptsLeft - 1;

  if (isCorrect) {
    // Add win bonus + speed bonus - hint penalty
    const speedBonus = newAttemptsLeft * POINTS_SPEED_BONUS;
    const hintPenalty = state.hintsUsed * HINT_PENALTY;
    const finalScore = newScore + POINTS_WIN_BONUS + speedBonus - hintPenalty;

    return {
      ...state,
      guesses: [...state.guesses, newGuess],
      currentGuess: '',
      gameStatus: 'won',
      usedLetters: newUsedLetters,
      attemptsLeft: newAttemptsLeft,
      score: Math.max(finalScore, 100), // Minimum score of 100 for winning
    };
  }

  // Used an attempt - check if out of attempts
  if (newAttemptsLeft <= 0) {
    return {
      ...state,
      guesses: [...state.guesses, newGuess],
      currentGuess: '',
      gameStatus: 'lost',
      usedLetters: newUsedLetters,
      attemptsLeft: 0,
      score: newScore, // Keep the score earned
    };
  }

  return {
    ...state,
    guesses: [...state.guesses, newGuess],
    currentGuess: '',
    usedLetters: newUsedLetters,
    attemptsLeft: newAttemptsLeft,
    score: newScore,
  };
}

// Use a hint to reveal a letter
export function useHint(state: GameState): GameState | { error: string } {
  if (state.gameStatus !== 'playing') {
    return { error: 'Game over' };
  }

  // Find unrevealed positions
  const unrevealedPositions: number[] = [];
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (!state.revealedPositions.includes(i)) {
      unrevealedPositions.push(i);
    }
  }

  if (unrevealedPositions.length === 0) {
    return { error: 'All letters revealed' };
  }

  // Reveal a random unrevealed position
  const randomIndex = Math.floor(Math.random() * unrevealedPositions.length);
  const positionToReveal = unrevealedPositions[randomIndex];
  const revealedLetter = state.targetWord[positionToReveal];

  // Update used letters
  const newUsedLetters = new Map(state.usedLetters);
  newUsedLetters.set(revealedLetter, 'correct');

  return {
    ...state,
    hintsUsed: state.hintsUsed + 1,
    revealedPositions: [...state.revealedPositions, positionToReveal],
    usedLetters: newUsedLetters,
  };
}

// Add a letter to current guess
export function addLetter(state: GameState, letter: string): GameState {
  if (state.currentGuess.length >= WORD_LENGTH) return state;
  if (state.gameStatus !== 'playing') return state;

  return {
    ...state,
    currentGuess: state.currentGuess + letter.toUpperCase(),
  };
}

// Remove last letter from current guess
export function removeLetter(state: GameState): GameState {
  if (state.currentGuess.length === 0) return state;

  return {
    ...state,
    currentGuess: state.currentGuess.slice(0, -1),
  };
}
