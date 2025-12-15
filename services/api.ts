// API service for Bazzani Arcade leaderboard

export type GameName = 'tetris' | 'snake' | 'flappy' | 'galaxy' | 'breakout' | 'slidle' | 'fives' | 'sudoku';

export interface ScoreEntry {
  name: string;
  score: number;
  date: string;
}

export interface TotalScoreEntry {
  name: string;
  totalScore: number;
  games: Record<GameName, number>;
}

export interface SubmitScoreResponse {
  success: boolean;
  position: number | null;
  isTopScore: boolean;
}

// Server URLs to try (in order of priority)
const SERVER_URLS = [
  'https://arcade.bazzani.info',
  'http://localhost:3000',
];

let activeServerUrl: string | null = null;

// Initialize and find working server
export const initializeServer = async (): Promise<string | null> => {
  for (const url of SERVER_URLS) {
    try {
      const response = await fetch(`${url}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'ok') {
          activeServerUrl = url;
          console.log(`Connected to server: ${url}`);
          return url;
        }
      }
    } catch (error) {
      console.log(`Server ${url} not available`);
    }
  }

  console.warn('No server available');
  return null;
};

// Get the active server URL
export const getServerUrl = (): string | null => activeServerUrl;

// Set server URL (for manual override or testing)
export const setServerUrl = (url: string | null): void => {
  activeServerUrl = url;
};

// Get leaderboard for a specific game
export const getLeaderboard = async (game: GameName): Promise<ScoreEntry[]> => {
  if (!activeServerUrl) {
    console.warn('No server connected');
    return [];
  }

  try {
    const response = await fetch(`${activeServerUrl}/api/leaderboard/${game}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
  }

  return [];
};

// Get total leaderboard (combined scores)
export const getTotalLeaderboard = async (): Promise<TotalScoreEntry[]> => {
  if (!activeServerUrl) {
    console.warn('No server connected');
    return [];
  }

  try {
    const response = await fetch(`${activeServerUrl}/api/leaderboard/total`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching total leaderboard:', error);
  }

  return [];
};

// Submit a new score
export const submitScore = async (
  game: GameName,
  name: string,
  score: number
): Promise<SubmitScoreResponse | null> => {
  if (!activeServerUrl) {
    console.warn('No server connected');
    return null;
  }

  try {
    const response = await fetch(`${activeServerUrl}/api/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game, name, score }),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error submitting score:', error);
  }

  return null;
};

// Check if server is connected
export const isServerConnected = (): boolean => {
  return activeServerUrl !== null;
};
