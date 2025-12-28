// server.js
// Minimal MyHomeGames backend with a safe launcher

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const https = require('https');

const app = express();
app.use(express.json());
app.use(cors());

const API_TOKEN = process.env.API_TOKEN || 'changeme';
const PORT = process.env.PORT || 4000;
const IGDB_CLIENT_ID = process.env.IGDB_CLIENT_ID || '';
const IGDB_CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET || '';
const METADATA_PATH = process.env.METADATA_PATH || path.join(process.env.HOME || process.env.USERPROFILE || '', 'Library', 'Application Support', 'MyHomeGames');

// Simple token auth middleware
function requireToken(req, res, next) {
  const token = req.header('X-Auth-Token') || req.query.token || req.header('Authorization');
  if (!token || token !== API_TOKEN) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// Load games whitelist from JSON files (one per library)
const GAMES_DIR = __dirname;
let allGames = {}; // Store all games by ID for launcher
let gamesByLibrary = {}; // Store games grouped by library

function loadGamesForLibrary(libraryKey) {
  const fileName = `games-${libraryKey}.json`;
  const filePath = path.join(GAMES_DIR, fileName);
  try {
    const txt = fs.readFileSync(filePath, 'utf8');
    const games = JSON.parse(txt);
    // Store games for this library
    gamesByLibrary[libraryKey] = games;
    // Add to allGames for launcher lookup
    games.forEach(game => {
      allGames[game.id] = game;
    });
    return games;
  } catch (e) {
    console.error(`Failed to load ${fileName}:`, e.message);
    return [];
  }
}

function loadAllGames() {
  // Load games for each library
  const libraries = ['consigliati', 'libreria', 'raccolte', 'categorie'];
  libraries.forEach(lib => {
    loadGamesForLibrary(lib);
  });
}

loadAllGames();

// Endpoint: list libraries (simple grouped view)
app.get('/libraries', requireToken, (req, res) => {
  // example: grouping by libraryType
  const libs = [
    { key: 'consigliati', title: 'Recommended', type: 'games' },
    { key: 'libreria', title: 'Library', type: 'games' },
    { key: 'raccolte', title: 'Collections', type: 'games' },
    { key: 'categorie', title: 'Categories', type: 'games' }
  ];
  res.json({ libraries: libs });
});

// Endpoint: serve game cover image (public, no auth required for images)
app.get('/covers/:gameId', (req, res) => {
  const gameId = decodeURIComponent(req.params.gameId);
  const coverPath = path.join(METADATA_PATH, gameId, 'cover.webp');
  
  // Check if file exists
  if (!fs.existsSync(coverPath)) {
    return res.status(404).json({ error: 'Cover not found' });
  }
  
  // Set appropriate content type for webp
  res.type('image/webp');
  res.sendFile(coverPath);
});

// Endpoint: list games by library
app.get('/libraries/:id/games', requireToken, (req, res) => {
  const libraryId = req.params.id;
  const libraryGames = gamesByLibrary[libraryId] || [];
  res.json({ 
    games: libraryGames.map(g => ({ 
      id: g.id, 
      title: g.title, 
      summary: g.summary || '', 
      cover: `/covers/${encodeURIComponent(g.id)}`,
      day: g.day || null,
      month: g.month || null,
      year: g.year || null,
      stars: g.stars || null
    })) 
  });
});

// Endpoint: launcher — launches a whitelisted command for a game
app.get('/launcher', requireToken, (req, res) => {
  const gameId = req.query.gameId;
  if (!gameId) return res.status(400).json({ error: 'Missing gameId' });

  const entry = allGames[String(gameId)];
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
  let responseSent = false;
  
  try {
    const child = spawn(command, args, {
      detached: true,
      stdio: 'ignore'
    });
    
    // Handle spawn errors (e.g., command not found) - this happens synchronously
    child.on('error', (err) => {
      console.error('Failed to spawn process:', err);
      if (!responseSent) {
        responseSent = true;
        const errorMessage = err.code === 'ENOENT' 
          ? `Command not found: ${command}. Please check if the executable exists.`
          : err.message;
        return res.status(500).json({ 
          error: 'Launch failed', 
          detail: errorMessage
        });
      }
    });

    // Only send success response if spawn succeeded
    child.once('spawn', () => {
      if (!responseSent) {
        responseSent = true;
        child.unref();
        return res.json({ status: 'launched', pid: child.pid });
      }
    });
  } catch (e) {
    console.error('Launch failed', e);
    if (!responseSent) {
      responseSent = true;
      return res.status(500).json({ error: 'Launch failed', detail: e.message });
    }
  }
});

// Reload games list (admin endpoint) — protected by token
app.post('/reload-games', requireToken, (req, res) => {
  allGames = {};
  gamesByLibrary = {};
  loadAllGames();
  const totalCount = Object.keys(allGames).length;
  res.json({ status: 'reloaded', count: totalCount });
});

// IGDB Access Token cache
let igdbAccessToken = null;
let igdbTokenExpiry = 0;

async function getIGDBAccessToken() {
  if (igdbAccessToken && Date.now() < igdbTokenExpiry) {
    return igdbAccessToken;
  }

  if (!IGDB_CLIENT_ID || !IGDB_CLIENT_SECRET) {
    throw new Error('IGDB credentials not configured');
  }

  return new Promise((resolve, reject) => {
    const postData = `client_id=${IGDB_CLIENT_ID}&client_secret=${IGDB_CLIENT_SECRET}&grant_type=client_credentials`;
    
    const options = {
      hostname: 'id.twitch.tv',
      path: '/oauth2/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.access_token) {
            igdbAccessToken = json.access_token;
            igdbTokenExpiry = Date.now() + (json.expires_in * 1000) - 60000; // Refresh 1 min before expiry
            resolve(igdbAccessToken);
          } else {
            reject(new Error('Failed to get IGDB access token'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Endpoint: search games on IGDB
app.get('/igdb/search', requireToken, async (req, res) => {
  const query = req.query.q;
  if (!query || query.trim() === '') {
    return res.status(400).json({ error: 'Missing search query' });
  }

  try {
    const accessToken = await getIGDBAccessToken();
    
    const postData = `search "${query}"; fields id,name,summary,cover.url,first_release_date; limit 20;`;
    
    const options = {
      hostname: 'api.igdb.com',
      path: '/v4/games',
      method: 'POST',
      headers: {
        'Client-ID': IGDB_CLIENT_ID,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'text/plain',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const igdbReq = https.request(options, (igdbRes) => {
      let data = '';
      igdbRes.on('data', (chunk) => { data += chunk; });
      igdbRes.on('end', () => {
        try {
          const games = JSON.parse(data);
          // Transform cover URLs to full URLs
          const transformed = games.map(game => ({
            id: game.id,
            name: game.name,
            summary: game.summary || '',
            cover: game.cover ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` : null,
            releaseDate: game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear() : null
          }));
          res.json({ games: transformed });
        } catch (e) {
          console.error('Error parsing IGDB response:', e);
          res.status(500).json({ error: 'Failed to parse IGDB response' });
        }
      });
    });

    igdbReq.on('error', (err) => {
      console.error('IGDB request error:', err);
      res.status(500).json({ error: 'Failed to search IGDB', detail: err.message });
    });

    igdbReq.write(postData);
    igdbReq.end();
  } catch (err) {
    console.error('IGDB search error:', err);
    res.status(500).json({ error: 'Failed to search IGDB', detail: err.message });
  }
});

app.listen(PORT, () => console.log(`MyHomeGames server listening on :${PORT}`));

