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
          summary: c.summary || "",
          cover: `/collection-covers/${encodeURIComponent(c.id)}`,
          gameCount: (c.games || []).length,
        };
        const background = getCollectionBackgroundPath(metadataPath, c.id);
        if (background) {
          collectionData.background = background;
        }
        return collectionData;
      }),
    });
  });

  // Endpoint: get single collection by ID
  app.get("/collections/:id", requireToken, (req, res) => {
    const collectionId = req.params.id;
    const collection = collectionsCache.find((c) => c.id === collectionId);
    
    if (!collection) {
      return res.status(404).json({ error: "Collection not found" });
    }
    
    const collectionData = {
      id: collection.id,
      title: collection.title,
      summary: collection.summary || "",
      cover: `/collection-covers/${encodeURIComponent(collection.id)}`,
      gameCount: (collection.games || []).length,
    };
    const background = getCollectionBackgroundPath(metadataPath, collection.id);
    if (background) {
      collectionData.background = background;
    }
    
    res.json(collectionData);
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
          command: game.command || null,
        });
      }
    });

    res.json({ games: collectionGames });
  });

  // Endpoint: update games order for a collection
  app.put("/collections/:id/games/order", requireToken, (req, res) => {
    const collectionId = req.params.id;
    const { gameIds } = req.body;
    
    if (!Array.isArray(gameIds)) {
      return res.status(400).json({ error: "gameIds must be an array" });
    }

    const collectionIndex = collectionsCache.findIndex((c) => c.id === collectionId);
    
    if (collectionIndex === -1) {
      return res.status(404).json({ error: "Collection not found" });
    }

    // Update the games array with the new order
    collectionsCache[collectionIndex].games = gameIds;

    // Save to file
    const fileName = "games-collections.json";
    const filePath = path.join(metadataGamesDir, fileName);
    try {
      fs.writeFileSync(filePath, JSON.stringify(collectionsCache, null, 2), "utf8");
      res.json({ status: "success" });
    } catch (e) {
      console.error(`Failed to save ${fileName}:`, e.message);
      res.status(500).json({ error: "Failed to save collection order" });
    }
  });

  // Endpoint: update collection fields
  app.put("/collections/:id", requireToken, (req, res) => {
    const collectionId = req.params.id;
    const updates = req.body;
    
    // Validate collection exists
    const collectionIndex = collectionsCache.findIndex((c) => c.id === collectionId);
    if (collectionIndex === -1) {
      return res.status(404).json({ error: "Collection not found" });
    }
    
    // Define allowed fields that can be updated
    const allowedFields = ['title', 'summary'];
    
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
    
    // Update collection in cache
    Object.assign(collectionsCache[collectionIndex], filteredUpdates);
    
    // Save to file
    const fileName = "games-collections.json";
    const filePath = path.join(metadataGamesDir, fileName);
    try {
      fs.writeFileSync(filePath, JSON.stringify(collectionsCache, null, 2), "utf8");
      
      // Return updated collection data
      const collection = collectionsCache[collectionIndex];
      const collectionData = {
        id: collection.id,
        title: collection.title,
        summary: collection.summary || "",
        cover: `/collection-covers/${encodeURIComponent(collection.id)}`,
        gameCount: (collection.games || []).length,
      };
      const background = getCollectionBackgroundPath(metadataPath, collection.id);
      if (background) {
        collectionData.background = background;
      }
      
      res.json({ status: "success", collection: collectionData });
    } catch (e) {
      console.error(`Failed to save ${fileName}:`, e.message);
      res.status(500).json({ error: "Failed to save collection updates" });
    }
  });

  // Endpoint: delete collection
  app.delete("/collections/:id", requireToken, (req, res) => {
    const collectionId = req.params.id;
    
    // Find collection index
    const collectionIndex = collectionsCache.findIndex((c) => c.id === collectionId);
    
    if (collectionIndex === -1) {
      return res.status(404).json({ error: "Collection not found" });
    }

    // Remove collection from cache
    collectionsCache.splice(collectionIndex, 1);

    // Save to file
    const fileName = "games-collections.json";
    const filePath = path.join(metadataGamesDir, fileName);
    try {
      fs.writeFileSync(filePath, JSON.stringify(collectionsCache, null, 2), "utf8");
      
      // Delete collection content directory (cover, background, etc.)
      const collectionContentDir = path.join(metadataPath, "content", "collections", collectionId);
      if (fs.existsSync(collectionContentDir)) {
        try {
          fs.rmSync(collectionContentDir, { recursive: true, force: true });
        } catch (rmError) {
          console.warn(`Failed to delete collection content directory for ${collectionId}:`, rmError.message);
          // Continue anyway, the collection was removed from the library
        }
      }
      
      res.json({ status: "success" });
    } catch (e) {
      console.error(`Failed to save ${fileName}:`, e.message);
      res.status(500).json({ error: "Failed to delete collection" });
    }
  });

  // Endpoint: serve collection cover image (public, no auth required for images)
  app.get("/collection-covers/:collectionId", (req, res) => {
    const collectionId = decodeURIComponent(req.params.collectionId);
    const coverPath = path.join(metadataPath, "content", "collections", collectionId, "cover.webp");

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

  // Endpoint: reload metadata for a single collection
  app.post("/collections/:id/reload", requireToken, (req, res) => {
    const collectionId = req.params.id;
    
    try {
      // Reload collections to refresh metadata
      collectionsCache = loadCollections(metadataGamesDir);
      
      // Find the collection
      const collection = collectionsCache.find((c) => c.id === collectionId);
      if (!collection) {
        return res.status(404).json({ error: "Collection not found" });
      }
      
      // Return updated collection data
      res.json({ status: "reloaded", collection });
    } catch (e) {
      console.error(`Failed to reload collection ${collectionId}:`, e.message);
      res.status(500).json({ error: "Failed to reload collection metadata" });
    }
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

