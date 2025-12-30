const fs = require("fs");
const path = require("path");

/**
 * Recommended routes module
 * Handles the recommended games endpoint
 */

function loadRecommendedSections(metadataGamesDir) {
  const fileName = "games-recommended.json";
  const filePath = path.join(metadataGamesDir, fileName);
  try {
    const txt = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(txt);
    
    // New format: array of sections with id and games
    if (Array.isArray(data)) {
      if (data.length > 0 && typeof data[0] === "object" && data[0].id && Array.isArray(data[0].games)) {
        // New format: array of sections
        return data;
      } else if (data.length > 0 && typeof data[0] === "string") {
        // Old format: array of IDs, convert to single section
        return [{
          id: "recommended",
          games: data
        }];
      } else if (data.length > 0 && typeof data[0] === "object" && data[0].id) {
        // Old format: array of objects, extract IDs and convert to single section
        return [{
          id: "recommended",
          games: data.map((game) => game.id)
        }];
      }
    }
    return [];
  } catch (e) {
    console.error(`Failed to load ${fileName}:`, e.message);
    return [];
  }
}

function registerRecommendedRoutes(app, requireToken, metadataGamesDir, allGames) {
  // Endpoint: get recommended games sections
  app.get("/recommended", requireToken, (req, res) => {
    const sections = loadRecommendedSections(metadataGamesDir);
    
    const sectionsWithGames = sections.map((section) => {
      // Get full game data from allGames
      const games = section.games
        .map((id) => allGames[id])
        .filter((game) => game != null) // Filter out any missing games
        .map((g) => ({
          id: g.id,
          title: g.title,
          summary: g.summary || "",
          cover: `/covers/${encodeURIComponent(g.id)}`,
          day: g.day || null,
          month: g.month || null,
          year: g.year || null,
          stars: g.stars || null,
          genre: g.genre || null,
        }));
      
      return {
        id: section.id,
        games: games,
      };
    });
    
    res.json({
      sections: sectionsWithGames,
    });
  });
}

module.exports = {
  loadRecommendedSections,
  registerRecommendedRoutes,
};

