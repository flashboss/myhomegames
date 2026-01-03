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
        criticratings: g.criticratings || null,
        userratings: g.userratings || null,
        command: g.command || null,
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
      criticratings: game.criticratings || null,
      userratings: game.userratings || null,
      command: game.command || null,
    };
    const background = getBackgroundPath(metadataPath, game.id);
    if (background) {
      gameData.background = background;
    }
    res.json(gameData);
  });

  // Endpoint: update game fields
  app.put("/games/:gameId", requireToken, (req, res) => {
    const gameId = req.params.gameId;
    const updates = req.body;
    
    // Validate game exists
    const game = allGames[gameId];
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }
    
    // Define allowed fields that can be updated
    const allowedFields = ['title', 'summary', 'year', 'month', 'day', 'stars', 'genre', 'command'];
    
    // Filter updates to only include allowed fields
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});
    
    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }
    
    // Update game in memory
    Object.assign(game, filteredUpdates);
    
    // Save to file
    const fileName = "games-library.json";
    const filePath = path.join(metadataGamesDir, fileName);
    try {
      // Read current library games
      const txt = fs.readFileSync(filePath, "utf8");
      const allLibraryGames = JSON.parse(txt);
      const gameIndex = allLibraryGames.findIndex((g) => g.id === gameId);
      
      if (gameIndex !== -1) {
        // Update existing game
        Object.assign(allLibraryGames[gameIndex], filteredUpdates);
      } else {
        // Game not in library file, skip (it might be in recommended/categories)
        return res.status(404).json({ error: "Game not found in library" });
      }
      
      fs.writeFileSync(filePath, JSON.stringify(allLibraryGames, null, 2), "utf8");
      
      // Update allGames cache to ensure it's in sync
      Object.assign(allGames[gameId], filteredUpdates);
      
      // Return updated game data
      const updatedGame = allLibraryGames[gameIndex];
      const gameData = {
        id: updatedGame.id,
        title: updatedGame.title,
        summary: updatedGame.summary || "",
        cover: `/covers/${encodeURIComponent(updatedGame.id)}`,
        day: updatedGame.day || null,
        month: updatedGame.month || null,
        year: updatedGame.year || null,
        stars: updatedGame.stars || null,
        genre: updatedGame.genre || null,
        criticratings: updatedGame.criticratings || null,
        userratings: updatedGame.userratings || null,
        command: updatedGame.command || null,
      };
      const background = getBackgroundPath(metadataPath, updatedGame.id);
      if (background) {
        gameData.background = background;
      }
      
      res.json({ status: "success", game: gameData });
    } catch (e) {
      console.error(`Failed to save ${fileName}:`, e.message);
      res.status(500).json({ error: "Failed to save game updates" });
    }
  });

  // Endpoint: reload metadata for a single game
  app.post("/games/:gameId/reload", requireToken, (req, res) => {
    const gameId = req.params.gameId;
    
    try {
      // Reload library games to refresh metadata
      loadLibraryGames(metadataGamesDir, allGames);
      
      // Check if game exists after reload
      const game = allGames[gameId];
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      
      // Return updated game data
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
        criticratings: game.criticratings || null,
        userratings: game.userratings || null,
        command: game.command || null,
      };
      const background = getBackgroundPath(metadataPath, game.id);
      if (background) {
        gameData.background = background;
      }
      
      res.json({ status: "reloaded", game: gameData });
    } catch (e) {
      console.error(`Failed to reload game ${gameId}:`, e.message);
      res.status(500).json({ error: "Failed to reload game metadata" });
    }
  });
}

module.exports = {
  loadLibraryGames,
  registerLibraryRoutes,
};

