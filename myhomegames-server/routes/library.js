const fs = require("fs");
const path = require("path");

/**
 * Library routes module
 * Handles the main library games endpoint
 */

// Helper function to check if background exists and return path if it does
function getBackgroundPath(metadataPath, gameId) {
  const backgroundPath = path.join(metadataPath, "content", "games", gameId, "background.webp");
  if (fs.existsSync(backgroundPath)) {
    return `/backgrounds/${encodeURIComponent(gameId)}`;
  }
  return null;
}

function loadLibraryGames(metadataGamesDir, allGames) {
  const fileName = "games-library.json";
  const filePath = path.join(metadataGamesDir, fileName);
  try {
    const txt = fs.readFileSync(filePath, "utf8");
    const games = JSON.parse(txt);
    // Add to allGames for launcher lookup
    games.forEach((game) => {
      allGames[game.id] = game;
    });
    return games;
  } catch (e) {
    console.error(`Failed to load ${fileName}:`, e.message);
    return [];
  }
}

function registerLibraryRoutes(app, requireToken, metadataGamesDir, allGames) {
  // Get metadata path (parent of metadataGamesDir)
  const metadataPath = path.dirname(metadataGamesDir);
  
  // Endpoint: get library games
  app.get("/libraries/library/games", requireToken, (req, res) => {
    const libraryGames = loadLibraryGames(metadataGamesDir, allGames);
    res.json({
      games: libraryGames.map((g) => ({
        id: g.id,
        title: g.title,
        summary: g.summary || "",
        cover: `/covers/${encodeURIComponent(g.id)}`,
        day: g.day || null,
        month: g.month || null,
        year: g.year || null,
        stars: g.stars || null,
        genre: g.genre || null,
      })),
    });
  });

  // Endpoint: get single game by ID
  app.get("/games/:gameId", requireToken, (req, res) => {
    const gameId = req.params.gameId;
    const game = allGames[gameId];
    
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }
    
    const gameData = {
      id: game.id,
      title: game.title,
      summary: game.summary || "",
      cover: `/covers/${encodeURIComponent(game.id)}`,
      day: game.day || null,
      month: game.month || null,
      year: game.year || null,
      stars: game.stars || null,
      genre: game.genre || null,
    };
    const background = getBackgroundPath(metadataPath, game.id);
    if (background) {
      gameData.background = background;
    }
    res.json(gameData);
  });
}

module.exports = {
  loadLibraryGames,
  registerLibraryRoutes,
};

