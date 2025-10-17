// server.js
// Minimal MyHomeGames backend with a safe launcher

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
app.use(express.json());
app.use(cors());

const API_TOKEN = process.env.API_TOKEN || 'changeme';
const PORT = process.env.PORT || 4000;

// Simple token auth middleware
function requireToken(req, res, next) {
  const token = req.header('X-Auth-Token') || req.query.token || req.header('Authorization');
  if (!token || token !== API_TOKEN) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// Load games whitelist from JSON
const GAMES_FILE = path.join(__dirname, 'games.json');
let games = [];
function loadGames() {
  try {
    const txt = fs.readFileSync(GAMES_FILE, 'utf8');
    games = JSON.parse(txt);
  } catch (e) {
    console.error('Failed to load games.json:', e.message);
    games = [];
  }
}
loadGames();

// Endpoint: list libraries (simple grouped view)
app.get('/libraries', requireToken, (req, res) => {
  // example: grouping by libraryType
  const libs = [
    { key: 'library_1', title: 'PC Games', type: 'games' },
    { key: 'library_2', title: 'Retro', type: 'games' }
  ];
  res.json({ libraries: libs });
});

// Endpoint: list games by library
app.get('/libraries/:id/games', requireToken, (req, res) => {
  // In this starter we return all games; real impl should filter by library id
  res.json({ games: games.map(g => ({ id: g.id, title: g.title, summary: g.summary || '', cover: g.cover || '' })) });
});

// Endpoint: launcher — launches a whitelisted command for a game
app.get('/launcher', requireToken, (req, res) => {
  const gameId = req.query.gameId;
  if (!gameId) return res.status(400).json({ error: 'Missing gameId' });

  const entry = games.find(g => g.id === String(gameId));
  if (!entry) return res.status(404).json({ error: 'Game not found' });

  // For safety: 'command' is an absolute path to the executable and 'args' is an array
  const command = entry.command;
  const args = entry.args || [];

  // Validate command path — must be inside allowed folder (optional)
  // Example: only allow commands inside a configured 'allowed_bin' directory
  if (entry.allowed_dir) {
    const allowedDir = path.resolve(entry.allowed_dir);
    const resolved = path.resolve(command);
    if (!resolved.startsWith(allowedDir)) {
      return res.status(403).json({ error: 'Command outside allowed directory' });
    }
  }

  // Spawn process without shell to avoid injection
  try {
    const child = spawn(command, args, {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();

    return res.json({ status: 'launched', pid: child.pid });
  } catch (e) {
    console.error('Launch failed', e);
    return res.status(500).json({ error: 'Launch failed', detail: e.message });
  }
});

// Reload games list (admin endpoint) — protected by token
app.post('/reload-games', requireToken, (req, res) => {
  loadGames();
  res.json({ status: 'reloaded', count: games.length });
});

app.listen(PORT, () => console.log(`MyHomeGames server listening on :${PORT}`));
