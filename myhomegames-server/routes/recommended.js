const fs = require("fs");
const path = require("path");

/**
 * Recommended routes module
 * Handles the recommended games endpoint
 */

function loadRecommendedGames(metadataGamesDir, allGames) {
  const fileName = "games-recommended.json";
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

function registerRecommendedRoutes(app, requireToken, metadataGamesDir, allGames) {
  // Endpoint: get recommended games
  app.get("/recommended", requireToken, (req, res) => {
    const recommendedGames = loadRecommendedGames(metadataGamesDir, allGames);
    res.json({
      games: recommendedGames.map((g) => ({
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
}

module.exports = {
  loadRecommendedGames,
  registerRecommendedRoutes,
};

