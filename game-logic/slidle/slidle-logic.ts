import { getRandomFiveLetterWords, isValidWord, getWordPoints } from '@/services/word-dictionary';

export const GRID_SIZE = 5;
export const TOTAL_TILES = GRID_SIZE * GRID_SIZE; // 25
export const EMPTY_TILE = ' ';

export interface Position {
  row: number;
  col: number;
}

export interface RowResult {
  row: number;
  word: string | null;
  points: number;
  isValid: boolean;
}

export interface GameState {
  grid: string[][];
  emptyPos: Position;
  moves: number;
  rowResults: RowResult[];
  totalScore: number;
  isComplete: boolean;
  startWords: string[]; // The original 5 words used to generate puzzle
  // Round-based timer mode
  round: number;
  roundScore: number; // Score for current round only
  totalGameScore: number; // Cumulative score across all rounds
  wordsFoundThisRound: string[];
  lockedRows: number[]; // Rows with valid words that are locked at the top
}

// Timer constants
export const INITIAL_TIME_SECONDS = 120; // 2 minutes
export const TIME_DECREMENT_SECONDS = 10; // Decrease by 10s each round
export const MINIMUM_TIME_SECONDS = 30; // Minimum 30 seconds

// Calculate time for a given round
export function getTimeForRound(round: number): number {
  const time = INITIAL_TIME_SECONDS - (round - 1) * TIME_DECREMENT_SECONDS;
  return Math.max(time, MINIMUM_TIME_SECONDS);
}

// Generate a seeded random number generator for daily puzzles
function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

// Get seed for today's date
export function getDailySeed(): number {
  const today = new Date();
  return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
}

// Get puzzle number (days since game launch)
export function getPuzzleNumber(): number {
  const launchDate = new Date('2024-12-14');
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - launchDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Generate a new puzzle with 5 valid starting words
export function generatePuzzle(seed?: number): GameState {
  const random = seed !== undefined ? seededRandom(seed) : Math.random;
  const maxAttempts = 50; // Prevent infinite loops

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Get 5 random 5-letter words
    const startWords = getRandomFiveLetterWords(5);

    // Create initial grid from words
    const letters: string[] = [];
    for (const word of startWords) {
      for (const letter of word) {
        letters.push(letter);
      }
    }

    // Shuffle letters using Fisher-Yates
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor((typeof random === 'function' ? random() : Math.random()) * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }

    // Remove one letter and add empty space
    letters.pop();
    letters.push(EMPTY_TILE);

    // Shuffle again to randomize empty position
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor((typeof random === 'function' ? random() : Math.random()) * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }

    // Create grid
    const grid: string[][] = [];
    let emptyPos: Position = { row: 0, col: 0 };

    for (let row = 0; row < GRID_SIZE; row++) {
      grid[row] = [];
      for (let col = 0; col < GRID_SIZE; col++) {
        const letter = letters[row * GRID_SIZE + col];
        grid[row][col] = letter;
        if (letter === EMPTY_TILE) {
          emptyPos = { row, col };
        }
      }
    }

    const state: GameState = {
      grid,
      emptyPos,
      moves: 0,
      rowResults: [],
      totalScore: 0,
      isComplete: false,
      startWords,
      round: 1,
      roundScore: 0,
      totalGameScore: 0,
      wordsFoundThisRound: [],
      lockedRows: [],
    };

    // Calculate initial row results
    updateRowResults(state);

    // Check if any row already has a valid word - if so, regenerate
    const hasValidWord = state.rowResults.some(r => r.isValid);
    if (!hasValidWord) {
      return state;
    }
  }

  // Fallback: return last generated state even if it has valid words
  // This should rarely happen
  const startWords = getRandomFiveLetterWords(5);
  const letters: string[] = [];
  for (const word of startWords) {
    for (const letter of word) {
      letters.push(letter);
    }
  }
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  letters.pop();
  letters.push(EMPTY_TILE);
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }

  const grid: string[][] = [];
  let emptyPos: Position = { row: 0, col: 0 };
  for (let row = 0; row < GRID_SIZE; row++) {
    grid[row] = [];
    for (let col = 0; col < GRID_SIZE; col++) {
      const letter = letters[row * GRID_SIZE + col];
      grid[row][col] = letter;
      if (letter === EMPTY_TILE) {
        emptyPos = { row, col };
      }
    }
  }

  const state: GameState = {
    grid,
    emptyPos,
    moves: 0,
    rowResults: [],
    totalScore: 0,
    isComplete: false,
    startWords,
    round: 1,
    roundScore: 0,
    totalGameScore: 0,
    wordsFoundThisRound: [],
    lockedRows: [],
  };
  updateRowResults(state);
  return state;
}

// Check if a position is adjacent to the empty tile
export function isAdjacent(pos: Position, emptyPos: Position): boolean {
  const rowDiff = Math.abs(pos.row - emptyPos.row);
  const colDiff = Math.abs(pos.col - emptyPos.col);

  // Adjacent means exactly one step horizontally OR vertically (not diagonal)
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

// Move a tile (swap with empty)
export function moveTile(state: GameState, pos: Position): GameState | null {
  if (!isAdjacent(pos, state.emptyPos)) {
    return null;
  }

  // Don't allow moving tiles that are in locked rows
  // But the empty tile can move anywhere (it's never in a locked row by design)
  if (state.lockedRows.includes(pos.row)) {
    return null;
  }

  // Create new grid
  const newGrid = state.grid.map(row => [...row]);

  // Swap tiles
  const tile = newGrid[pos.row][pos.col];
  newGrid[pos.row][pos.col] = EMPTY_TILE;
  newGrid[state.emptyPos.row][state.emptyPos.col] = tile;

  const newState: GameState = {
    ...state,
    grid: newGrid,
    emptyPos: { ...pos },
    moves: state.moves + 1,
  };

  // Update row results
  updateRowResults(newState);

  // Check for newly valid rows and lock them
  lockValidRows(newState);

  return newState;
}

// Lock valid rows and move them to the top
// IMPORTANT: Never lock a row that contains the empty tile!
function lockValidRows(state: GameState): void {
  // Find rows that are valid but not yet locked
  const newlyValidRows: number[] = [];

  for (const result of state.rowResults) {
    // Only lock if valid AND does not contain the empty tile
    const rowHasEmpty = state.emptyPos.row === result.row;
    if (result.isValid && !state.lockedRows.includes(result.row) && !rowHasEmpty) {
      newlyValidRows.push(result.row);
    }
  }

  // Process each newly valid row
  for (const validRow of newlyValidRows) {
    // Find first available row (not locked)
    const targetRow = state.lockedRows.length;

    if (validRow !== targetRow) {
      // Swap rows in grid
      const temp = state.grid[targetRow];
      state.grid[targetRow] = state.grid[validRow];
      state.grid[validRow] = temp;

      // Update empty position if affected
      if (state.emptyPos.row === validRow) {
        state.emptyPos.row = targetRow;
      } else if (state.emptyPos.row === targetRow) {
        state.emptyPos.row = validRow;
      }
    }

    // Lock the target row
    state.lockedRows.push(targetRow);
  }

  // Recalculate row results after swapping
  if (newlyValidRows.length > 0) {
    updateRowResults(state);
  }
}

// Check a single row for valid words
// Searches for valid 5-letter or 4-letter CONTIGUOUS words (no gaps allowed)
function checkRow(row: string[]): RowResult {
  const hasEmpty = row.includes(EMPTY_TILE);
  const emptyIndex = row.indexOf(EMPTY_TILE);

  if (!hasEmpty) {
    // No empty tile - check full 5-letter word first (highest points)
    const fullString = row.join('');
    if (isValidWord(fullString)) {
      return {
        row: 0,
        word: fullString.toUpperCase(),
        points: 3,
        isValid: true,
      };
    }
    // Also check for 4-letter words within the 5 letters
    // Positions: 0-3 or 1-4
    for (let start = 0; start <= 1; start++) {
      const word = fullString.slice(start, start + 4);
      if (isValidWord(word)) {
        return { row: 0, word: word.toUpperCase(), points: 2, isValid: true };
      }
    }
  } else {
    // Has empty tile - check for contiguous 4-letter sequences
    // The empty tile creates two segments: before and after it
    // We can only form valid words from contiguous letters

    // Check if empty is at start (index 0) - letters 1-4 are contiguous
    if (emptyIndex === 0) {
      const word = row.slice(1, 5).join('');
      if (isValidWord(word)) {
        return { row: 0, word: word.toUpperCase(), points: 2, isValid: true };
      }
    }
    // Check if empty is at end (index 4) - letters 0-3 are contiguous
    else if (emptyIndex === 4) {
      const word = row.slice(0, 4).join('');
      if (isValidWord(word)) {
        return { row: 0, word: word.toUpperCase(), points: 2, isValid: true };
      }
    }
    // Empty is in the middle - no 4-letter contiguous sequence possible
    // We could check for 3-letter words but let's skip those
  }

  return { row: 0, word: null, points: 0, isValid: false };
}

// Update all row results
function updateRowResults(state: GameState): void {
  state.rowResults = [];
  state.totalScore = 0;

  for (let i = 0; i < GRID_SIZE; i++) {
    const result = checkRow(state.grid[i]);
    result.row = i;
    state.rowResults.push(result);
    state.totalScore += result.points;
  }

  // Check if puzzle is complete (max score = 15)
  state.isComplete = state.totalScore === 15;
}

// Get tiles adjacent to empty (movable tiles)
export function getMovableTiles(state: GameState): Position[] {
  const movable: Position[] = [];
  const { row, col } = state.emptyPos;

  // Check all 4 directions
  const directions = [
    { row: row - 1, col }, // up
    { row: row + 1, col }, // down
    { row, col: col - 1 }, // left
    { row, col: col + 1 }, // right
  ];

  for (const pos of directions) {
    if (pos.row >= 0 && pos.row < GRID_SIZE && pos.col >= 0 && pos.col < GRID_SIZE) {
      movable.push(pos);
    }
  }

  return movable;
}

// Generate share text
export function generateShareText(state: GameState, puzzleNumber: number): string {
  const rowEmojis = state.rowResults.map(r =>
    r.isValid ? '\u{1F7E9}\u{1F7E9}\u{1F7E9}\u{1F7E9}\u{1F7E9}' : '\u{2B1B}\u{2B1B}\u{2B1B}\u{2B1B}\u{2B1B}'
  ).join('\n');

  return `SLIDLE #${puzzleNumber}
${state.totalScore} points
${state.moves} moves

${rowEmojis}

Play at bazzani.info/arcade`;
}

// Daily puzzle storage key
export function getDailyStorageKey(): string {
  return `slidle_daily_${getDailySeed()}`;
}

// Stats storage key
export const STATS_STORAGE_KEY = 'slidle_stats';

export interface SlidleStats {
  gamesPlayed: number;
  totalScore: number;
  bestScore: number;
  totalMoves: number;
  currentStreak: number;
  maxStreak: number;
  lastPlayedDate: string | null;
}

export const DEFAULT_STATS: SlidleStats = {
  gamesPlayed: 0,
  totalScore: 0,
  bestScore: 0,
  totalMoves: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastPlayedDate: null,
};
