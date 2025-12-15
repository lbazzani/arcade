const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'scores.json');
const MAX_SCORES_PER_GAME = 20;

// Rate limiting per protezione DoS
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // max 100 richieste per IP per minuto
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const scoreLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10, // max 10 submit score per IP per minuto (anti-spam)
  message: { error: 'Too many score submissions, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10kb' })); // Limita size del body
app.use(generalLimiter);

// Helper: Read scores from file
const readScores = () => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading scores:', error);
    return {
      tetris: [],
      snake: [],
      flappy: [],
      galaxy: [],
      breakout: [],
      slidle: []
    };
  }
};

// Helper: Write scores to file
const writeScores = (scores) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(scores, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing scores:', error);
    return false;
  }
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get total leaderboard (sum of best scores per game for each player)
// IMPORTANT: This route must be defined BEFORE /api/leaderboard/:game
app.get('/api/leaderboard/total', (req, res) => {
  const scores = readScores();
  const playerTotals = {};

  // For each game, find the best score per player
  Object.keys(scores).forEach(game => {
    const gameScores = scores[game] || [];

    // Group by player and get their best score
    const playerBest = {};
    gameScores.forEach(entry => {
      const name = entry.name.toUpperCase();
      if (!playerBest[name] || entry.score > playerBest[name]) {
        playerBest[name] = entry.score;
      }
    });

    // Add to player totals
    Object.keys(playerBest).forEach(name => {
      if (!playerTotals[name]) {
        playerTotals[name] = { name, totalScore: 0, games: {} };
      }
      playerTotals[name].totalScore += playerBest[name];
      playerTotals[name].games[game] = playerBest[name];
    });
  });

  // Convert to array, sort, and return top 20
  const topPlayers = Object.values(playerTotals)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, MAX_SCORES_PER_GAME);

  res.json(topPlayers);
});

// Get leaderboard for a specific game
app.get('/api/leaderboard/:game', (req, res) => {
  const { game } = req.params;
  const validGames = ['tetris', 'snake', 'flappy', 'galaxy', 'breakout', 'slidle'];

  if (!validGames.includes(game)) {
    return res.status(400).json({ error: 'Invalid game name' });
  }

  const scores = readScores();
  const gameScores = scores[game] || [];

  // Sort by score descending and return top 20
  const topScores = gameScores
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SCORES_PER_GAME);

  res.json(topScores);
});

// Submit a new score
app.post('/api/score', scoreLimiter, (req, res) => {
  const { game, name, score } = req.body;

  // Validation
  if (!game || !name || score === undefined) {
    return res.status(400).json({ error: 'Missing required fields: game, name, score' });
  }

  const validGames = ['tetris', 'snake', 'flappy', 'galaxy', 'breakout', 'slidle'];
  if (!validGames.includes(game)) {
    return res.status(400).json({ error: 'Invalid game name' });
  }

  if (typeof name !== 'string' || name.length === 0 || name.length > 10) {
    return res.status(400).json({ error: 'Name must be 1-10 characters' });
  }

  if (typeof score !== 'number' || score < 0) {
    return res.status(400).json({ error: 'Score must be a positive number' });
  }

  const scores = readScores();

  // Add new score
  const newEntry = {
    name: name.toUpperCase(),
    score,
    date: new Date().toISOString()
  };

  scores[game].push(newEntry);

  // Sort and keep only top scores
  scores[game] = scores[game]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SCORES_PER_GAME);

  // Save
  if (!writeScores(scores)) {
    return res.status(500).json({ error: 'Failed to save score' });
  }

  // Find position of this score
  const position = scores[game].findIndex(
    s => s.name === newEntry.name && s.score === newEntry.score && s.date === newEntry.date
  );

  res.json({
    success: true,
    position: position !== -1 ? position + 1 : null,
    isTopScore: position !== -1 && position < MAX_SCORES_PER_GAME
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Bazzani Arcade Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
