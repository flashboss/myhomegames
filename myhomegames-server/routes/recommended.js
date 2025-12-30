const fs = require("fs");
const path = require("path");

/**
 * Recommended routes module
 * Handles the recommended games endpoint
 */

function loadRecommendedGameIds(metadataGamesDir) {
  const fileName = "games-recommended.json";
  const filePath = path.join(metadataGamesDir, fileName);
  try {
    const txt = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(txt);
    // Support both old format (array of objects) and new format (array of IDs)
    if (Array.isArray(data)) {
      if (data.length > 0 && typeof data[0] === "string") {
        // New format: array of IDs
        return data;
      } else if (data.length > 0 && typeof data[0] === "object" && data[0].id) {
        // Old format: array of objects, extract IDs
        return data.map((game) => game.id);
      }
    }
    return [];
  } catch (e) {
    console.error(`Failed to load ${fileName}:`, e.message);
    return [];
  }
}

function registerRecommendedRoutes(app, requireToken, metadataGamesDir, allGames) {
  // Endpoint: get recommended games
  app.get("/recommended", requireToken, (req, res) => {
    const recommendedIds = loadRecommendedGameIds(metadataGamesDir);
    // Get full game data from allGames
    const recommendedGames = recommendedIds
      .map((id) => allGames[id])
      .filter((game) => game != null); // Filter out any missing games
    
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
  loadRecommendedGameIds,
  registerRecommendedRoutes,
};

