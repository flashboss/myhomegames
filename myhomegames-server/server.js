// server.js
// Minimal MyHomeGames backend with a safe launcher

// Load environment variables from .env file
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const https = require("https");

// Import route modules
const libraryRoutes = require("./routes/library");
const recommendedRoutes = require("./routes/recommended");
const categoriesRoutes = require("./routes/categories");
const collectionsRoutes = require("./routes/collections");
const authRoutes = require("./routes/auth");

const app = express();
app.use(express.json());
app.use(cors());

const API_TOKEN = process.env.API_TOKEN;
const PORT = process.env.PORT || 4000; // PORT can have a default
const IGDB_CLIENT_ID = process.env.IGDB_CLIENT_ID;
const IGDB_CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET;
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const API_BASE = process.env.API_BASE;
const METADATA_PATH =
  process.env.METADATA_PATH ||
  path.join(
    process.env.HOME || process.env.USERPROFILE || "",
    "Library",
    "Application Support",
    "MyHomeGames"
  );

// Token auth middleware - supports both development token and Twitch tokens
function requireToken(req, res, next) {
  const token =
    req.header("X-Auth-Token") ||
    req.query.token ||
    req.header("Authorization");
  
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Check if it's the development token (for development only)
  if (API_TOKEN && token === API_TOKEN) {
    return next();
  }

  // Check if it's a valid Twitch token
  if (authRoutes.isValidToken(token, METADATA_PATH)) {
    return next();
  }

  return res.status(401).json({ error: "Unauthorized" });
}

// Load games whitelist from JSON files
// Games JSON files are stored in METADATA_PATH/metadata/
const METADATA_GAMES_DIR = path.join(METADATA_PATH, "metadata");
let allGames = {}; // Store all games by ID for launcher

// Load all games on startup
libraryRoutes.loadLibraryGames(METADATA_GAMES_DIR, allGames);
// Recommended games are now just IDs pointing to games already in allGames

// Register routes
authRoutes.registerAuthRoutes(app, METADATA_PATH);
libraryRoutes.registerLibraryRoutes(app, requireToken, METADATA_GAMES_DIR, allGames);
recommendedRoutes.registerRecommendedRoutes(app, requireToken, METADATA_GAMES_DIR, allGames);
categoriesRoutes.registerCategoriesRoutes(app, requireToken, METADATA_PATH, METADATA_GAMES_DIR);
const collectionsHandler = collectionsRoutes.registerCollectionsRoutes(
  app,
  requireToken,
  METADATA_PATH,
  METADATA_GAMES_DIR,
  allGames
);

// Endpoint: serve game cover image (public, no auth required for images)
app.get("/covers/:gameId", (req, res) => {
  const gameId = decodeURIComponent(req.params.gameId);
  const coverPath = path.join(METADATA_PATH, "content", "games", gameId, "cover.webp");

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  // Check if file exists
  if (!fs.existsSync(coverPath)) {
    // Return 404 with image content type to avoid CORB issues
    res.setHeader('Content-Type', 'image/webp');
    return res.status(404).end();
  }

  // Set appropriate content type for webp
  res.type("image/webp");
  res.sendFile(coverPath);
});

// Endpoint: serve game background image (public, no auth required for images)
app.get("/backgrounds/:gameId", (req, res) => {
  const gameId = decodeURIComponent(req.params.gameId);
  const backgroundPath = path.join(METADATA_PATH, "content", "games", gameId, "background.webp");

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  // Check if file exists
  if (!fs.existsSync(backgroundPath)) {
    // Return 404 with image content type to avoid CORB issues
    res.setHeader('Content-Type', 'image/webp');
    return res.status(404).end();
  }

  // Set appropriate content type for webp
  res.type("image/webp");
  res.sendFile(backgroundPath);
});

// Endpoint: serve collection background image (public, no auth required for images)
app.get("/collection-backgrounds/:collectionId", (req, res) => {
  const collectionId = decodeURIComponent(req.params.collectionId);
  const backgroundPath = path.join(METADATA_PATH, "content", "collections", collectionId, "background.webp");

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  // Check if file exists
  if (!fs.existsSync(backgroundPath)) {
    // Return 404 with image content type to avoid CORB issues
    res.setHeader('Content-Type', 'image/webp');
    return res.status(404).end();
  }

  // Set appropriate content type for webp
  res.type("image/webp");
  res.sendFile(backgroundPath);
});

// Endpoint: launcher — launches a whitelisted command for a game
app.get("/launcher", requireToken, (req, res) => {
  const gameId = req.query.gameId;
  if (!gameId) return res.status(400).json({ error: "Missing gameId" });

  const entry = allGames[String(gameId)];
  if (!entry) return res.status(404).json({ error: "Game not found" });

  // For safety: 'command' is an absolute path to the executable (can include arguments)
  const command = entry.command;

  // Validate command exists
  if (!command || typeof command !== 'string' || command.trim() === '') {
    return res.status(400).json({
      error: "Launch failed",
      detail: "Command is missing or invalid. Please check the game configuration."
    });
  }

  // Spawn process with shell to allow command with arguments
  let responseSent = false;

  try {
    const child = spawn(command, {
      shell: true,
      detached: true,
      stdio: "ignore",
    });

    // Handle spawn errors (e.g., command not found) - this happens synchronously
    child.on("error", (err) => {
      console.error("Failed to spawn process:", err);
      if (!responseSent) {
        responseSent = true;
        const errorMessage =
          err.code === "ENOENT"
            ? `Command not found: ${command}. Please check if the executable exists.`
            : err.message;
        return res.status(500).json({
          error: "Launch failed",
          detail: errorMessage,
        });
      }
    });

    // Only send success response if spawn succeeded
    child.once("spawn", () => {
      if (!responseSent) {
        responseSent = true;
        child.unref();
        return res.json({ status: "launched", pid: child.pid });
      }
    });
  } catch (e) {
    console.error("Launch failed", e);
    if (!responseSent) {
      responseSent = true;
      // Include full error message and stack if available
      const errorDetail = e.message || e.toString() || "Unknown error occurred";
      return res
        .status(500)
        .json({ error: "Launch failed", detail: errorDetail });
    }
  }
});

// Reload games list (admin endpoint) — protected by token
app.post("/reload-games", requireToken, (req, res) => {
  allGames = {};
  libraryRoutes.loadLibraryGames(METADATA_GAMES_DIR, allGames);
  // Recommended games are now just IDs pointing to games already in allGames
  const collectionsCache = collectionsHandler.reload();
  const totalCount = Object.keys(allGames).length;
  res.json({ status: "reloaded", count: totalCount, collections: collectionsCache.length });
});

// IGDB Access Token cache
let igdbAccessToken = null;
let igdbTokenExpiry = 0;

async function getIGDBAccessToken() {
  if (igdbAccessToken && Date.now() < igdbTokenExpiry) {
    return igdbAccessToken;
  }

  if (!IGDB_CLIENT_ID || !IGDB_CLIENT_SECRET) {
    throw new Error("IGDB credentials not configured");
  }

  return new Promise((resolve, reject) => {
    const postData = `client_id=${IGDB_CLIENT_ID}&client_secret=${IGDB_CLIENT_SECRET}&grant_type=client_credentials`;

    const options = {
      hostname: "id.twitch.tv",
      path: "/oauth2/token",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (json.access_token) {
            igdbAccessToken = json.access_token;
            igdbTokenExpiry = Date.now() + json.expires_in * 1000 - 60000; // Refresh 1 min before expiry
            resolve(igdbAccessToken);
          } else {
            reject(new Error("Failed to get IGDB access token"));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

// Endpoint: search games on IGDB
app.get("/igdb/search", requireToken, async (req, res) => {
  const query = req.query.q;
  if (!query || query.trim() === "") {
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ error: "Missing search query" });
  }

  try {
    const accessToken = await getIGDBAccessToken();

    const postData = `search "${query}"; fields id,name,summary,cover.url,first_release_date; limit 20;`;

    const options = {
      hostname: "api.igdb.com",
      path: "/v4/games",
      method: "POST",
      headers: {
        "Client-ID": IGDB_CLIENT_ID,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "text/plain",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const igdbReq = https.request(options, (igdbRes) => {
      let data = "";
      igdbRes.on("data", (chunk) => {
        data += chunk;
      });
      igdbRes.on("end", () => {
        try {
          const games = JSON.parse(data);
          // Transform cover URLs to full URLs
          const transformed = games.map((game) => ({
            id: game.id,
            name: game.name,
            summary: game.summary || "",
            cover: game.cover
              ? `https:${game.cover.url.replace("t_thumb", "t_cover_big")}`
              : null,
            releaseDate: game.first_release_date
              ? new Date(game.first_release_date * 1000).getFullYear()
              : null,
          }));
          res.setHeader('Content-Type', 'application/json');
          res.json({ games: transformed });
        } catch (e) {
          console.error("Error parsing IGDB response:", e);
          res.setHeader('Content-Type', 'application/json');
          res.status(500).json({ error: "Failed to parse IGDB response" });
        }
      });
    });

    igdbReq.on("error", (err) => {
      console.error("IGDB request error:", err);
      res.setHeader('Content-Type', 'application/json');
      res
        .status(500)
        .json({ error: "Failed to search IGDB", detail: err.message });
    });

    igdbReq.write(postData);
    igdbReq.end();
  } catch (err) {
    console.error("IGDB search error:", err);
    res.setHeader('Content-Type', 'application/json');
    res
      .status(500)
      .json({ error: "Failed to search IGDB", detail: err.message });
  }
});

// Settings file path - stored in metadata path root
const SETTINGS_FILE = path.join(METADATA_PATH, "settings.json");

// Helper function to read settings
function readSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Error reading settings:", e.message);
  }
  // Return default settings
  return {
    language: "en",
  };
}

// Helper function to write settings
function writeSettings(settings) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf8");
    return true;
  } catch (e) {
    console.error("Error writing settings:", e.message);
    return false;
  }
}

// Endpoint: get settings
app.get("/settings", requireToken, (req, res) => {
  const settings = readSettings();
  res.json(settings);
});

// Endpoint: update settings
app.put("/settings", requireToken, (req, res) => {
  const currentSettings = readSettings();
  const updatedSettings = {
    ...currentSettings,
    ...req.body,
  };

  if (writeSettings(updatedSettings)) {
    res.json({ status: "success", settings: updatedSettings });
  } else {
    res.status(500).json({ error: "Failed to save settings" });
  }
});

// Validate required environment variables
function validateEnvironment() {
  const errors = [];
  
  // Read environment variables directly
  const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
  const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
  const API_BASE = process.env.API_BASE;
  const IGDB_CLIENT_ID = process.env.IGDB_CLIENT_ID;
  const IGDB_CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET;
  
  // Check if Twitch OAuth is configured (all or nothing)
  const hasTwitchClientId = !!TWITCH_CLIENT_ID;
  const hasTwitchClientSecret = !!TWITCH_CLIENT_SECRET;
  const hasApiBase = !!API_BASE;
  
  if (hasTwitchClientId || hasTwitchClientSecret || hasApiBase) {
    if (!hasTwitchClientId) {
      errors.push("TWITCH_CLIENT_ID is required when using Twitch OAuth");
    }
    if (!hasTwitchClientSecret) {
      errors.push("TWITCH_CLIENT_SECRET is required when using Twitch OAuth");
    }
    if (!hasApiBase) {
      errors.push("API_BASE is required when using Twitch OAuth");
    }
  }
  
  // Check if IGDB is configured (both or neither)
  const hasIgdbClientId = !!IGDB_CLIENT_ID;
  const hasIgdbClientSecret = !!IGDB_CLIENT_SECRET;
  
  if (hasIgdbClientId !== hasIgdbClientSecret) {
    errors.push("Both IGDB_CLIENT_ID and IGDB_CLIENT_SECRET must be set together, or both omitted");
  }
  
  if (errors.length > 0) {
    console.error("Environment configuration errors:");
    errors.forEach(error => console.error(`  - ${error}`));
    console.error("\nPlease configure your .env file with the required variables.");
    process.exit(1);
  }
}

// Only start listening if not in test environment
if (process.env.NODE_ENV !== 'test') {
  validateEnvironment();
  app.listen(PORT, () => {
    console.log(`MyHomeGames server listening on :${PORT}`);
    if (!API_TOKEN && !TWITCH_CLIENT_ID) {
      console.warn("Warning: No authentication configured. Set either API_TOKEN (for dev) or TWITCH_CLIENT_ID/TWITCH_CLIENT_SECRET (for production).");
    }
  });
}

// Export app for testing
module.exports = app;
