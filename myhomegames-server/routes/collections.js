const fs = require("fs");
const path = require("path");

/**
 * Collections routes module
 * Handles collections endpoints
 */

function loadCollections(metadataGamesDir) {
  const fileName = "games-collections.json";
  const filePath = path.join(metadataGamesDir, fileName);
  try {
    const txt = fs.readFileSync(filePath, "utf8");
    return JSON.parse(txt);
  } catch (e) {
    console.error(`Failed to load ${fileName}:`, e.message);
    return [];
  }
}

// Helper function to check if collection background exists and return path if it does
function getCollectionBackgroundPath(metadataPath, collectionId) {
  const backgroundPath = path.join(metadataPath, "content", "collections", collectionId, "background.webp");
  if (fs.existsSync(backgroundPath)) {
    return `/collection-backgrounds/${encodeURIComponent(collectionId)}`;
  }
  return null;
}

function registerCollectionsRoutes(app, requireToken, metadataPath, metadataGamesDir, allGames) {
  let collectionsCache = loadCollections(metadataGamesDir);

  // Endpoint: list collections
  app.get("/collections", requireToken, (req, res) => {
    res.json({
      collections: collectionsCache.map((c) => {
        const collectionData = {
          id: c.id,
          title: c.title,
          cover: `/collection-covers/${encodeURIComponent(c.id)}`,
        };
        const background = getCollectionBackgroundPath(metadataPath, c.id);
        if (background) {
          collectionData.background = background;
        }
        return collectionData;
      }),
    });
  });

  // Endpoint: get games for a collection (returns games by their IDs)
  app.get("/collections/:id/games", requireToken, (req, res) => {
    const collectionId = req.params.id;
    const collection = collectionsCache.find((c) => c.id === collectionId);
    
    if (!collection) {
      return res.status(404).json({ error: "Collection not found" });
    }

    // Get games by their IDs from the collection
    const gameIds = collection.games || [];
    const collectionGames = [];

    gameIds.forEach((gameId) => {
      const game = allGames[gameId];
      if (game) {
        collectionGames.push({
          id: game.id,
          title: game.title,
          summary: game.summary || "",
          cover: `/covers/${encodeURIComponent(game.id)}`,
          day: game.day || null,
          month: game.month || null,
          year: game.year || null,
          stars: game.stars || null,
        });
      }
    });

    res.json({ games: collectionGames });
  });

  // Endpoint: serve collection cover image (public, no auth required for images)
  app.get("/collection-covers/:collectionId", (req, res) => {
    const collectionId = decodeURIComponent(req.params.collectionId);
    const coverPath = path.join(metadataPath, "content", "collections", collectionId, "cover.webp");

    // Check if file exists
    if (!fs.existsSync(coverPath)) {
      return res.status(404).json({ error: "Cover not found" });
    }

    // Set appropriate content type for webp
    res.type("image/webp");
    res.sendFile(coverPath);
  });

  // Return reload function
  return {
    reload: () => {
      collectionsCache = loadCollections(metadataGamesDir);
      return collectionsCache;
    },
    getCache: () => collectionsCache,
  };
}

module.exports = {
  loadCollections,
  registerCollectionsRoutes,
};

