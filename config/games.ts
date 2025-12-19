// Centralized game configuration
// Add new games here and they will automatically appear in:
// - Home screen
// - Leaderboard tabs
// - API types
// - Score submission

export interface GameConfig {
  id: string;
  name: string;
  description: string;
  route: string;
  icon: string;
  color: string;
  category: 'arcade' | 'word' | 'number';
  badge?: string; // Optional badge like "DAILY", "NEW", etc.
}

// All games defined in one place
export const GAMES: GameConfig[] = [
  // Arcade Games
  {
    id: 'tetris',
    name: 'Baz Blocks',
    description: 'Stack the blocks!',
    route: '/games/tetris',
    icon: '🧩',
    color: '#4A90E2',
    category: 'arcade',
  },
  {
    id: 'snake',
    name: 'Snake',
    description: 'Classic snake game',
    route: '/games/snake',
    icon: '🐍',
    color: '#4CAF50',
    category: 'arcade',
  },
  {
    id: 'flappy',
    name: 'Baz Bird',
    description: 'Fly through the pipes!',
    route: '/games/flappy',
    icon: '🐦',
    color: '#FFD93D',
    category: 'arcade',
  },
  {
    id: 'galaxy',
    name: 'Galaxy Shooter',
    description: 'Defend the galaxy!',
    route: '/games/galaxy',
    icon: '🚀',
    color: '#00D4FF',
    category: 'arcade',
  },
  {
    id: 'breakout',
    name: 'Breakout',
    description: 'Smash all the bricks!',
    route: '/games/breakout',
    icon: '🧱',
    color: '#FF4757',
    category: 'arcade',
  },
  {
    id: 'superbaz',
    name: 'Super Baz',
    description: 'Run, jump, collect coins!',
    route: '/games/superbaz',
    icon: '🏃',
    color: '#E74C3C',
    category: 'arcade',
  },
  {
    id: 'bazkart',
    name: 'Baz Kart',
    description: 'Race to the finish!',
    route: '/games/bazkart',
    icon: '🏎️',
    color: '#FF6B35',
    category: 'arcade',
    badge: 'NEW',
  },
  // Word Games
  {
    id: 'slidle',
    name: 'Slidle',
    description: 'Slide tiles to form words',
    route: '/wordgames/slidle',
    icon: '🔤',
    color: '#FF6B9D',
    category: 'word',
    badge: 'DAILY',
  },
  {
    id: 'fives',
    name: 'Fives',
    description: 'Guess the 5-letter word in 6 attempts',
    route: '/wordgames/fives',
    icon: '5️⃣',
    color: '#E85D75',
    category: 'word',
  },
  // Number Games
  {
    id: 'sudoku',
    name: 'Sudoku',
    description: 'Fill the grid with numbers 1-9',
    route: '/numbergames/sudoku',
    icon: '9️⃣',
    color: '#9B59B6',
    category: 'number',
  },
];

// Helper functions
export const getGameById = (id: string): GameConfig | undefined =>
  GAMES.find(game => game.id === id);

export const getGamesByCategory = (category: GameConfig['category']): GameConfig[] =>
  GAMES.filter(game => game.category === category);

export const getArcadeGames = (): GameConfig[] => getGamesByCategory('arcade');
export const getWordGames = (): GameConfig[] => getGamesByCategory('word');
export const getNumberGames = (): GameConfig[] => getGamesByCategory('number');

// For type safety - generates union type from game IDs
export type GameName = typeof GAMES[number]['id'];

// Get all game IDs as array (useful for API initialization)
export const ALL_GAME_IDS = GAMES.map(game => game.id) as GameName[];

// Color map for quick lookup
export const GAME_COLORS: Record<string, string> = Object.fromEntries(
  GAMES.map(game => [game.id, game.color])
);

// Name map for quick lookup
export const GAME_NAMES: Record<string, string> = Object.fromEntries(
  GAMES.map(game => [game.id, game.name.toUpperCase()])
);

// Leaderboard tabs configuration
export const LEADERBOARD_TABS = [
  { key: 'total' as const, label: 'TOTAL', color: '#FFD700' },
  ...GAMES.map(game => ({
    key: game.id,
    label: game.name.toUpperCase(),
    color: game.color,
  })),
];

// Initial empty scores for all games
export const createEmptyScores = <T>(): Record<string, T[]> =>
  Object.fromEntries(GAMES.map(game => [game.id, []]));
