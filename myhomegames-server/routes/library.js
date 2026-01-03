const fs = require("fs");
const path = require("path");
const multer = require("multer");

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
    
    // Handle command field: if null or undefined, delete physical file and remove from JSON
    const isUnlinkingCommand = 'command' in filteredUpdates && (filteredUpdates.command === null || filteredUpdates.command === undefined);
    
    if (isUnlinkingCommand) {
      // Delete physical executable files (script.sh and script.bat)
      const gameContentDir = path.join(metadataPath, "content", "games", gameId);
      const scriptShPath = path.join(gameContentDir, "script.sh");
      const scriptBatPath = path.join(gameContentDir, "script.bat");
      
      try {
        if (fs.existsSync(scriptShPath)) {
          fs.unlinkSync(scriptShPath);
          console.log(`Deleted ${scriptShPath}`);
        }
        if (fs.existsSync(scriptBatPath)) {
          fs.unlinkSync(scriptBatPath);
          console.log(`Deleted ${scriptBatPath}`);
        }
      } catch (deleteError) {
        console.warn(`Failed to delete executable files for game ${gameId}:`, deleteError.message);
        // Continue anyway, don't fail the request
      }
      
      // Remove command from filteredUpdates (don't set it to null, remove it)
      delete filteredUpdates.command;
    } else if ('command' in filteredUpdates && filteredUpdates.command) {
      // Validate that command is a valid extension (sh or bat, without dot)
      const commandValue = String(filteredUpdates.command).trim().toLowerCase();
      // Remove dot if present
      const normalizedExt = commandValue.startsWith('.') ? commandValue.substring(1) : commandValue;
      
      if (normalizedExt !== 'sh' && normalizedExt !== 'bat') {
        return res.status(400).json({ 
          error: "Invalid command extension. Only 'sh' and 'bat' are allowed." 
        });
      }
      
      // Save without dot (just "sh" or "bat")
      filteredUpdates.command = normalizedExt;
    }
    
    // Check if there are any updates left after handling command removal
    if (Object.keys(filteredUpdates).length === 0 && !isUnlinkingCommand) {
      return res.status(400).json({ error: "No valid fields to update" });
    }
    
    // Log received updates for debugging
    if (filteredUpdates.command) {
      console.log('Received command update:', {
        gameId: gameId,
        command: filteredUpdates.command,
        commandType: typeof filteredUpdates.command,
        commandLength: filteredUpdates.command.length
      });
    }
    
    // Update game in memory
    if (Object.keys(filteredUpdates).length > 0) {
      Object.assign(game, filteredUpdates);
    }
    // If command was unlinked, remove it from game object
    if (isUnlinkingCommand) {
      delete game.command;
    }
    
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
        if (Object.keys(filteredUpdates).length > 0) {
          Object.assign(allLibraryGames[gameIndex], filteredUpdates);
        }
        // Remove command field if it was unlinked
        if (isUnlinkingCommand && 'command' in allLibraryGames[gameIndex]) {
          delete allLibraryGames[gameIndex].command;
        }
      } else {
        // Game not in library file, skip (it might be in recommended/categories)
        return res.status(404).json({ error: "Game not found in library" });
      }
      
      fs.writeFileSync(filePath, JSON.stringify(allLibraryGames, null, 2), "utf8");
      
      // Update allGames cache to ensure it's in sync
      if (Object.keys(filteredUpdates).length > 0) {
        Object.assign(allGames[gameId], filteredUpdates);
      }
      // Remove command from cache if it was unlinked
      if (isUnlinkingCommand && allGames[gameId].command) {
        delete allGames[gameId].command;
      }
      
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
      };
      // Only include command if it exists
      if (updatedGame.command !== undefined && updatedGame.command !== null) {
        gameData.command = updatedGame.command;
      }
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

  // Configure multer for file uploads (memory storage, we'll save manually)
  const upload = multer({ storage: multer.memoryStorage() });

  // Endpoint: upload executable file for a game
  app.post("/games/:gameId/upload-executable", requireToken, upload.single('file'), (req, res) => {
    const { gameId } = req.params;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    // Validate file extension (only .sh or .bat allowed)
    const originalName = file.originalname || '';
    const fileExtension = path.extname(originalName).toLowerCase();
    
    if (fileExtension !== '.sh' && fileExtension !== '.bat') {
      return res.status(400).json({ error: "Only .sh and .bat files are allowed" });
    }
    
    // Validate game exists
    const game = allGames[gameId];
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }
    
    try {
      // Create game content directory if it doesn't exist
      const gameContentDir = path.join(metadataPath, "content", "games", gameId);
      if (!fs.existsSync(gameContentDir)) {
        fs.mkdirSync(gameContentDir, { recursive: true });
      }
      
      // Always rename to script.sh or script.bat based on extension
      const scriptName = fileExtension === '.bat' ? 'script.bat' : 'script.sh';
      const executablePath = path.join(gameContentDir, scriptName);
      
      // Write file to disk
      fs.writeFileSync(executablePath, file.buffer);
      
      // Make file executable (Unix-like systems, only for .sh files)
      if (fileExtension === '.sh') {
        try {
          fs.chmodSync(executablePath, 0o755);
        } catch (chmodError) {
          // Ignore chmod errors on Windows
          console.warn('Could not set executable permissions:', chmodError.message);
        }
      }
      
      // Save the extension in the game's command field (without dot: "sh" or "bat")
      const commandValue = fileExtension.substring(1); // Remove the dot (.sh -> sh, .bat -> bat)
      game.command = commandValue;
      
      // Update the game in the JSON file
      const fileName = "games-library.json";
      const filePath = path.join(metadataGamesDir, fileName);
      try {
        const txt = fs.readFileSync(filePath, "utf8");
        const allLibraryGames = JSON.parse(txt);
        const gameIndex = allLibraryGames.findIndex((g) => g.id === gameId);
        
        if (gameIndex !== -1) {
          allLibraryGames[gameIndex].command = commandValue;
          fs.writeFileSync(filePath, JSON.stringify(allLibraryGames, null, 2), "utf8");
        }
        // Update allGames cache
        allGames[gameId].command = commandValue;
      } catch (saveError) {
        console.warn(`Failed to save command field for game ${gameId}:`, saveError.message);
        // Continue anyway, the file was uploaded successfully
      }
      
      // Return the extension (without dot) and updated game data
      const background = getBackgroundPath(metadataPath, game.id);
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
        command: commandValue, // Return without dot ("sh" or "bat")
      };
      if (background) {
        gameData.background = background;
      }
      
      res.json({ 
        status: "success",
        game: gameData,
      });
    } catch (error) {
      console.error(`Failed to save executable for game ${gameId}:`, error);
      res.status(500).json({ error: "Failed to save executable file" });
    }
  });
}

module.exports = {
  loadLibraryGames,
  registerLibraryRoutes,
};

