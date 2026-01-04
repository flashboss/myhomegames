const fs = require("fs");
const path = require("path");

/**
 * Categories routes module
 * Handles categories endpoints
 */

function loadCategories(metadataGamesDir) {
  const fileName = "games-categories.json";
  const filePath = path.join(metadataGamesDir, fileName);
  try {
    const txt = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(txt);
    
    // Ensure it's an array of strings
    if (!Array.isArray(parsed)) {
      console.warn(`Invalid format in ${fileName}, expected array, got ${typeof parsed}`);
      return [];
    }
    
    // Filter to only strings
    return parsed.filter(item => typeof item === "string");
  } catch (e) {
    console.error(`Failed to load ${fileName}:`, e.message);
    return [];
  }
}


// Helper function to create a category if it doesn't exist (returns category title or null)
function ensureCategoryExists(metadataGamesDir, genreTitle) {
  if (!genreTitle || typeof genreTitle !== "string" || !genreTitle.trim()) {
    return null;
  }

  const trimmedTitle = genreTitle.trim();
  const categories = loadCategories(metadataGamesDir);
  
  // Check if category already exists (exact match)
  if (categories.includes(trimmedTitle)) {
    return trimmedTitle;
  }

  // Add new category
  categories.push(trimmedTitle);
  
  // Sort categories alphabetically
  categories.sort((a, b) => a.localeCompare(b));

  // Save to file
  const fileName = "games-categories.json";
  const filePath = path.join(metadataGamesDir, fileName);
  try {
    fs.writeFileSync(filePath, JSON.stringify(categories, null, 2), "utf8");
    return trimmedTitle;
  } catch (e) {
    console.error(`Failed to save ${fileName}:`, e.message);
    return null;
  }
}

function registerCategoriesRoutes(app, requireToken, metadataPath, metadataGamesDir, allGames) {
  // Endpoint: serve category cover image (public, no auth required for images)
  app.get("/category-covers/:categoryTitle", (req, res) => {
    const categoryTitle = decodeURIComponent(req.params.categoryTitle);
    const coverPath = path.join(metadataPath, "content", "categories", categoryTitle, "cover.webp");

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

  // Endpoint: list categories
  app.get("/categories", requireToken, (req, res) => {
    const categories = loadCategories(metadataGamesDir);
    res.json({
      categories: categories,
    });
  });

  // Endpoint: create new category
  app.post("/categories", requireToken, (req, res) => {
    const { title } = req.body;
    
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    // Check if category already exists before creating
    const categories = loadCategories(metadataGamesDir);
    const trimmedTitle = title.trim();
    
    if (categories.includes(trimmedTitle)) {
      return res.status(409).json({ 
        error: "Category already exists", 
        category: trimmedTitle
      });
    }

    // Create the category
    const categoryTitle = ensureCategoryExists(metadataGamesDir, title);
    
    if (!categoryTitle) {
      return res.status(500).json({ error: "Failed to create category" });
    }
    
    res.json({
      category: categoryTitle,
    });
  });

  // Endpoint: delete category (only if not used by any game)
  app.delete("/categories/:categoryTitle", requireToken, (req, res) => {
    const categoryTitle = decodeURIComponent(req.params.categoryTitle);
    const categories = loadCategories(metadataGamesDir);
    
    // Find the category
    const categoryIndex = categories.indexOf(categoryTitle);
    if (categoryIndex === -1) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Reload games from file to ensure we have the latest data
    const libraryGamesFile = path.join(metadataGamesDir, "games-library.json");
    let allGamesFromFile = {};
    try {
      const gamesTxt = fs.readFileSync(libraryGamesFile, "utf8");
      const gamesArray = JSON.parse(gamesTxt);
      gamesArray.forEach((game) => {
        allGamesFromFile[game.id] = game;
      });
    } catch (e) {
      console.error("Failed to reload games for category deletion check:", e.message);
      // Fallback to in-memory allGames
      allGamesFromFile = allGames;
    }

    // Check if category is used by any game (exact match)
    const isUsed = Object.values(allGamesFromFile).some((game) => {
      if (!game.genre) return false;
      if (Array.isArray(game.genre)) {
        return game.genre.includes(categoryTitle);
      }
      return String(game.genre) === categoryTitle;
    });

    if (isUsed) {
      return res.status(409).json({ 
        error: "Category is still in use by one or more games",
        message: "Cannot delete category that is assigned to games"
      });
    }

    // Remove category
    categories.splice(categoryIndex, 1);

    // Save to file
    const fileName = "games-categories.json";
    const filePath = path.join(metadataGamesDir, fileName);
    try {
      fs.writeFileSync(filePath, JSON.stringify(categories, null, 2), "utf8");
      
      // Delete category content directory (cover, etc.)
      const categoryContentDir = path.join(metadataPath, "content", "categories", categoryTitle);
      if (fs.existsSync(categoryContentDir)) {
        try {
          fs.rmSync(categoryContentDir, { recursive: true, force: true });
        } catch (rmError) {
          console.warn(`Failed to delete category content directory for ${categoryId}:`, rmError.message);
          // Continue anyway, the category was removed from the library
        }
      }
      
      res.json({ status: "success", message: "Category deleted" });
    } catch (e) {
      console.error(`Failed to save ${fileName}:`, e.message);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });
}

/**
 * Delete a category if it's not used by any game
 * @param {string} metadataPath - Path to metadata directory
 * @param {string} metadataGamesDir - Path to metadata/games directory
 * @param {string} categoryTitle - Category title to delete
 * @param {Object} allGamesFromFile - Object with all games (gameId -> game object)
 * @returns {boolean} - True if category was deleted, false if it's still in use
 */
function deleteCategoryIfUnused(metadataPath, metadataGamesDir, categoryTitle, allGamesFromFile) {
  const categories = loadCategories(metadataGamesDir);
  
  // Find the category
  const categoryIndex = categories.indexOf(categoryTitle);
  if (categoryIndex === -1) {
    return false; // Category not found
  }

  // Check if category is used by any game (exact match)
  const isUsed = Object.values(allGamesFromFile).some((game) => {
    if (!game.genre) return false;
    if (Array.isArray(game.genre)) {
      return game.genre.includes(categoryTitle);
    }
    return String(game.genre) === categoryTitle;
  });

  if (isUsed) {
    return false; // Category is still in use
  }

  // Remove category
  categories.splice(categoryIndex, 1);

  // Save to file
  const fileName = "games-categories.json";
  const filePath = path.join(metadataGamesDir, fileName);
  try {
    fs.writeFileSync(filePath, JSON.stringify(categories, null, 2), "utf8");
    
    // Delete category content directory (cover, etc.)
    const categoryContentDir = path.join(metadataPath, "content", "categories", categoryTitle);
    if (fs.existsSync(categoryContentDir)) {
      try {
        fs.rmSync(categoryContentDir, { recursive: true, force: true });
      } catch (rmError) {
        console.warn(`Failed to delete category content directory for ${categoryId}:`, rmError.message);
        // Continue anyway, the category was removed from the library
      }
    }
    
    return true; // Category was deleted
  } catch (e) {
    console.error(`Failed to save ${fileName}:`, e.message);
    return false; // Failed to delete
  }
}

module.exports = {
  loadCategories,
  ensureCategoryExists,
  deleteCategoryIfUnused,
  registerCategoriesRoutes,
};

