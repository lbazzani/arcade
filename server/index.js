const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const { Expo } = require('expo-server-sdk');

const app = express();
const expo = new Expo();
const PORT = process.env.PORT || 3010;
const DATA_FILE = path.join(__dirname, 'data', 'scores.json');
const TOKENS_FILE = path.join(__dirname, 'data', 'push-tokens.json');
const MAX_SCORES_PER_GAME = 20;

// Nomi giochi in italiano per le notifiche
const GAME_NAMES = {
  tetris: 'BAZ BLOCKS',
  snake: 'SNAKE',
  flappy: 'BAZ BIRD',
  galaxy: 'GALAXY SHOOTER',
  breakout: 'BREAKOUT',
  slidle: 'SLIDLE',
  fives: 'FIVES',
  sudoku: 'SUDOKU',
  superbaz: 'SUPER BAZ',
  bazkart: 'BAZ KART',
};

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
      slidle: [],
      fives: [],
      sudoku: [],
      superbaz: [],
      bazkart: []
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

// Helper: Read push tokens from file
const readPushTokens = () => {
  try {
    if (!fs.existsSync(TOKENS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(TOKENS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading push tokens:', error);
    return [];
  }
};

// Helper: Write push tokens to file
const writePushTokens = (tokens) => {
  try {
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing push tokens:', error);
    return false;
  }
};

// Helper: Send push notifications to all registered devices
const sendPushNotifications = async (title, body, data = {}) => {
  const tokens = readPushTokens();

  if (tokens.length === 0) {
    console.log('No push tokens registered');
    return;
  }

  // Filtra solo i token Expo validi
  const validTokens = tokens.filter(token => Expo.isExpoPushToken(token));

  if (validTokens.length === 0) {
    console.log('No valid Expo push tokens');
    return;
  }

  // Crea i messaggi
  const messages = validTokens.map(token => ({
    to: token,
    sound: 'default',
    title,
    body,
    data,
  }));

  // Invia in chunks (Expo ha un limite)
  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log('Push notifications sent:', ticketChunk);

      // Rimuovi token non validi
      ticketChunk.forEach((ticket, index) => {
        if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
          const invalidToken = chunk[index].to;
          console.log('Removing invalid token:', invalidToken);
          const updatedTokens = readPushTokens().filter(t => t !== invalidToken);
          writePushTokens(updatedTokens);
        }
      });
    } catch (error) {
      console.error('Error sending push notifications:', error);
    }
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
  const validGames = ['tetris', 'snake', 'flappy', 'galaxy', 'breakout', 'slidle', 'fives', 'sudoku', 'superbaz', 'bazkart'];

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

// Register push token
app.post('/api/push-token', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Missing token' });
  }

  if (!Expo.isExpoPushToken(token)) {
    return res.status(400).json({ error: 'Invalid Expo push token' });
  }

  const tokens = readPushTokens();

  // Evita duplicati
  if (!tokens.includes(token)) {
    tokens.push(token);
    writePushTokens(tokens);
    console.log('New push token registered:', token);
  }

  res.json({ success: true });
});

// Submit a new score
app.post('/api/score', scoreLimiter, async (req, res) => {
  const { game, name, score } = req.body;

  // Validation
  if (!game || !name || score === undefined) {
    return res.status(400).json({ error: 'Missing required fields: game, name, score' });
  }

  const validGames = ['tetris', 'snake', 'flappy', 'galaxy', 'breakout', 'slidle', 'fives', 'sudoku', 'superbaz', 'bazkart'];
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

  // Controlla se è un nuovo record (primo posto)
  const currentTopScore = scores[game]?.[0]?.score || 0;
  const isNewRecord = score > currentTopScore;

  // Add new score
  const newEntry = {
    name: name.toUpperCase(),
    score,
    date: new Date().toISOString()
  };

  if (!scores[game]) {
    scores[game] = [];
  }
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

  // Se è un nuovo record, invia notifica a tutti
  if (isNewRecord && position === 0) {
    const gameName = GAME_NAMES[game] || game.toUpperCase();
    const formattedScore = score.toLocaleString('it-IT');

    sendPushNotifications(
      '🏆 Nuovo Record!',
      `${newEntry.name} ha battuto il record di ${gameName} con ${formattedScore} punti!`,
      { game }
    );
  }

  res.json({
    success: true,
    position: position !== -1 ? position + 1 : null,
    isTopScore: position !== -1 && position < MAX_SCORES_PER_GAME,
    isNewRecord: isNewRecord && position === 0
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Bazzani Arcade Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
