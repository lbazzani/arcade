export const GRID_SIZE = 9;
export const BOX_SIZE = 3;

// Time-based scoring system (like Slidle)
// Round 1: 10 min, Round 2: 9 min, ... Round 9+: 2 min (minimum)
export const INITIAL_TIME = 600; // 10 minutes in seconds
export const TIME_DECREASE_PER_ROUND = 60; // 1 minute less each round
export const MIN_TIME = 120; // 2 minutes minimum

// Penalties (subtract from remaining time)
export const MISTAKE_PENALTY = 30; // -30 seconds per mistake
export const HINT_PENALTY = 60; // -60 seconds per hint

// Number of cells to remove (always medium difficulty for time-based mode)
const CELLS_TO_REMOVE = 45;

export interface Cell {
  value: number | null;
  isOriginal: boolean;
  isSelected: boolean;
  isHighlighted: boolean;
  isError: boolean;
  notes: Set<number>;
}

export interface GameState {
  grid: Cell[][];
  solution: number[][];
  selectedCell: { row: number; col: number } | null;
  round: number;
  gameStatus: 'playing' | 'won' | 'lost';
  mistakes: number;
  hintsUsed: number;
  totalScore: number; // Accumulated score from previous rounds
  timeLeft: number; // Seconds remaining
  isNotesMode: boolean;
}

// Calculate time for a given round
export function getTimeForRound(round: number): number {
  const time = INITIAL_TIME - (round - 1) * TIME_DECREASE_PER_ROUND;
  return Math.max(time, MIN_TIME);
}

// Generate a valid Sudoku solution using backtracking
function generateSolution(): number[][] {
  const grid: number[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));

  function isValidPlacement(grid: number[][], row: number, col: number, num: number): boolean {
    // Check row
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[row][c] === num) return false;
    }

    // Check column
    for (let r = 0; r < GRID_SIZE; r++) {
      if (grid[r][col] === num) return false;
    }

    // Check 3x3 box
    const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
    const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
    for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
      for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
        if (grid[r][c] === num) return false;
      }
    }

    return true;
  }

  function solve(grid: number[][]): boolean {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (grid[row][col] === 0) {
          // Shuffle numbers 1-9 for randomization
          const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);

          for (const num of nums) {
            if (isValidPlacement(grid, row, col, num)) {
              grid[row][col] = num;
              if (solve(grid)) return true;
              grid[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  solve(grid);
  return grid;
}

// Create puzzle by removing cells from solution
function createPuzzle(solution: number[][]): Cell[][] {
  const puzzle: Cell[][] = solution.map(row =>
    row.map(value => ({
      value,
      isOriginal: true,
      isSelected: false,
      isHighlighted: false,
      isError: false,
      notes: new Set<number>(),
    }))
  );

  // Get all cell positions and shuffle
  const positions: { row: number; col: number }[] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      positions.push({ row, col });
    }
  }
  positions.sort(() => Math.random() - 0.5);

  // Remove cells
  let removed = 0;
  for (const pos of positions) {
    if (removed >= CELLS_TO_REMOVE) break;
    puzzle[pos.row][pos.col].value = null;
    puzzle[pos.row][pos.col].isOriginal = false;
    removed++;
  }

  return puzzle;
}

// Initialize a new game (round 1)
export function initializeGame(): GameState {
  const solution = generateSolution();
  const grid = createPuzzle(solution);

  return {
    grid,
    solution,
    selectedCell: null,
    round: 1,
    gameStatus: 'playing',
    mistakes: 0,
    hintsUsed: 0,
    totalScore: 0,
    timeLeft: getTimeForRound(1),
    isNotesMode: false,
  };
}

// Start next round (after completing a puzzle)
export function startNextRound(state: GameState): GameState {
  const solution = generateSolution();
  const grid = createPuzzle(solution);
  const newRound = state.round + 1;

  return {
    grid,
    solution,
    selectedCell: null,
    round: newRound,
    gameStatus: 'playing',
    mistakes: 0,
    hintsUsed: 0,
    totalScore: state.totalScore + state.timeLeft, // Add remaining time as score
    timeLeft: getTimeForRound(newRound),
    isNotesMode: false,
  };
}

// Check if placement is valid (for highlighting conflicts)
export function isValidPlacement(state: GameState, row: number, col: number, num: number): boolean {
  const { grid } = state;

  // Check row
  for (let c = 0; c < GRID_SIZE; c++) {
    if (c !== col && grid[row][c].value === num) return false;
  }

  // Check column
  for (let r = 0; r < GRID_SIZE; r++) {
    if (r !== row && grid[r][col].value === num) return false;
  }

  // Check 3x3 box
  const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
  for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
    for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
      if ((r !== row || c !== col) && grid[r][c].value === num) return false;
    }
  }

  return true;
}

// Select a cell
export function selectCell(state: GameState, row: number, col: number): GameState {
  if (state.gameStatus !== 'playing') return state;

  const newGrid = state.grid.map((r, ri) =>
    r.map((cell, ci) => ({
      ...cell,
      isSelected: ri === row && ci === col,
      isHighlighted: ri === row || ci === col ||
        (Math.floor(ri / BOX_SIZE) === Math.floor(row / BOX_SIZE) &&
         Math.floor(ci / BOX_SIZE) === Math.floor(col / BOX_SIZE)),
    }))
  );

  return {
    ...state,
    grid: newGrid,
    selectedCell: { row, col },
  };
}

// Place a number in the selected cell
export function placeNumber(state: GameState, num: number): GameState {
  if (state.gameStatus !== 'playing' || !state.selectedCell) return state;

  const { row, col } = state.selectedCell;
  const cell = state.grid[row][col];

  // Can't modify original cells
  if (cell.isOriginal) return state;

  // Notes mode
  if (state.isNotesMode) {
    const newNotes = new Set(cell.notes);
    if (newNotes.has(num)) {
      newNotes.delete(num);
    } else {
      newNotes.add(num);
    }

    const newGrid = state.grid.map((r, ri) =>
      r.map((c, ci) =>
        ri === row && ci === col
          ? { ...c, notes: newNotes, value: null }
          : c
      )
    );

    return { ...state, grid: newGrid };
  }

  // Check if correct
  const isCorrect = state.solution[row][col] === num;

  let newMistakes = state.mistakes;
  let newTimeLeft = state.timeLeft;
  let newGameStatus = state.gameStatus;

  if (!isCorrect) {
    newMistakes++;
    newTimeLeft = Math.max(0, newTimeLeft - MISTAKE_PENALTY);

    if (newTimeLeft <= 0) {
      newGameStatus = 'lost';
    }
  }

  const newGrid = state.grid.map((r, ri) =>
    r.map((c, ci) =>
      ri === row && ci === col
        ? { ...c, value: num, notes: new Set<number>(), isError: !isCorrect }
        : c
    )
  );

  // Check if won (completed the puzzle)
  if (newGameStatus === 'playing') {
    const isComplete = newGrid.every((r, ri) =>
      r.every((c, ci) => c.value === state.solution[ri][ci])
    );

    if (isComplete) {
      newGameStatus = 'won';
    }
  }

  return {
    ...state,
    grid: newGrid,
    mistakes: newMistakes,
    timeLeft: newTimeLeft,
    gameStatus: newGameStatus,
  };
}

// Clear the selected cell
export function clearCell(state: GameState): GameState {
  if (state.gameStatus !== 'playing' || !state.selectedCell) return state;

  const { row, col } = state.selectedCell;
  const cell = state.grid[row][col];

  // Can't clear original cells
  if (cell.isOriginal) return state;

  const newGrid = state.grid.map((r, ri) =>
    r.map((c, ci) =>
      ri === row && ci === col
        ? { ...c, value: null, notes: new Set<number>(), isError: false }
        : c
    )
  );

  return { ...state, grid: newGrid };
}

// Use a hint
export function useHint(state: GameState): GameState {
  if (state.gameStatus !== 'playing' || !state.selectedCell) return state;

  const { row, col } = state.selectedCell;
  const cell = state.grid[row][col];

  // Can't use hint on original or already correct cells
  if (cell.isOriginal || cell.value === state.solution[row][col]) return state;

  const correctValue = state.solution[row][col];

  // Apply time penalty
  let newTimeLeft = Math.max(0, state.timeLeft - HINT_PENALTY);
  let newGameStatus = state.gameStatus;

  if (newTimeLeft <= 0) {
    newGameStatus = 'lost';
  }

  const newGrid = state.grid.map((r, ri) =>
    r.map((c, ci) =>
      ri === row && ci === col
        ? { ...c, value: correctValue, notes: new Set<number>(), isError: false }
        : c
    )
  );

  // Check if won
  if (newGameStatus === 'playing') {
    const isComplete = newGrid.every((r, ri) =>
      r.every((c, ci) => c.value === state.solution[ri][ci])
    );

    if (isComplete) {
      newGameStatus = 'won';
    }
  }

  return {
    ...state,
    grid: newGrid,
    hintsUsed: state.hintsUsed + 1,
    timeLeft: newTimeLeft,
    gameStatus: newGameStatus,
  };
}

// Toggle notes mode
export function toggleNotesMode(state: GameState): GameState {
  return { ...state, isNotesMode: !state.isNotesMode };
}

// Tick the timer (call every second)
export function tickTimer(state: GameState): GameState {
  if (state.gameStatus !== 'playing') return state;

  const newTimeLeft = state.timeLeft - 1;

  if (newTimeLeft <= 0) {
    return {
      ...state,
      timeLeft: 0,
      gameStatus: 'lost',
    };
  }

  return { ...state, timeLeft: newTimeLeft };
}

// Get final score (totalScore + remaining time from current round)
export function getFinalScore(state: GameState): number {
  return state.totalScore + (state.gameStatus === 'won' ? state.timeLeft : 0);
}

// Format time as MM:SS
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Get count of a number in the grid
export function getNumberCount(state: GameState, num: number): number {
  let count = 0;
  for (const row of state.grid) {
    for (const cell of row) {
      if (cell.value === num) count++;
    }
  }
  return count;
}
