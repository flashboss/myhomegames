const fs = require("fs");
const path = require("path");

/**
 * Library routes module
 * Handles the main library games endpoint
 */

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
    
    res.json({
      id: game.id,
      title: game.title,
      summary: game.summary || "",
      cover: `/covers/${encodeURIComponent(game.id)}`,
      day: game.day || null,
      month: game.month || null,
      year: game.year || null,
      stars: game.stars || null,
      genre: game.genre || null,
    });
  });
}

module.exports = {
  loadLibraryGames,
  registerLibraryRoutes,
};

