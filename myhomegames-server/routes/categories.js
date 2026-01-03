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
    return JSON.parse(txt);
  } catch (e) {
    console.error(`Failed to load ${fileName}:`, e.message);
    return [];
  }
}

/**
 * Normalize a single genre title to lowercase (same normalization as categories)
 * @param {string} genreTitle - The genre title to normalize
 * @returns {string|null} - Normalized genre title or null if invalid
 */
function normalizeGenre(genreTitle) {
  if (!genreTitle || typeof genreTitle !== "string" || !genreTitle.trim()) {
    return null;
  }
  return genreTitle.trim().toLowerCase();
}

/**
 * Normalize an array of genres to lowercase (same normalization as categories)
 * @param {string[]|null|undefined} genres - Array of genre titles to normalize
 * @returns {string[]|null} - Array of normalized genre titles or null if empty/invalid
 */
function normalizeGenres(genres) {
  if (!genres || !Array.isArray(genres) || genres.length === 0) {
    return null;
  }
  
  const normalized = genres
    .filter((g) => g && typeof g === "string" && g.trim())
    .map((g) => normalizeGenre(g))
    .filter((g) => g !== null);
  
  return normalized.length > 0 ? normalized : null;
}

// Helper function to create a category if it doesn't exist (returns category ID or null)
function ensureCategoryExists(metadataGamesDir, genreTitle) {
  const normalizedTitle = normalizeGenre(genreTitle);
  if (!normalizedTitle) {
    return null;
  }

  const categories = loadCategories(metadataGamesDir);
  
  // Check if category already exists (by title)
  const existingCategory = categories.find(
    (c) => c.title.toLowerCase() === normalizedTitle
  );
  
  if (existingCategory) {
    return existingCategory.id;
  }

  // Generate ID: genre_<normalized_title>
  const newId = `genre_${normalizedTitle.replace(/\s+/g, "_")}`;
  
  // Check if ID already exists
  const existingById = categories.find((c) => c.id === newId);
  if (existingById) {
    return existingById.id;
  }

  // Create new category
  const newCategory = {
    id: newId,
    title: normalizedTitle,
  };

  // Add to categories array
  categories.push(newCategory);
  
  // Sort categories by title
  categories.sort((a, b) => a.title.localeCompare(b.title));

  // Save to file
  const fileName = "games-categories.json";
  const filePath = path.join(metadataGamesDir, fileName);
  try {
    fs.writeFileSync(filePath, JSON.stringify(categories, null, 2), "utf8");
    return newCategory.id;
  } catch (e) {
    console.error(`Failed to save ${fileName}:`, e.message);
    return null;
  }
}

function registerCategoriesRoutes(app, requireToken, metadataPath, metadataGamesDir, allGames) {
  // Endpoint: serve category cover image (public, no auth required for images)
  app.get("/category-covers/:categoryId", (req, res) => {
    const categoryId = decodeURIComponent(req.params.categoryId);
    const coverPath = path.join(metadataPath, "content", "categories", categoryId, "cover.webp");

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
      categories: categories.map((c) => ({
        id: c.id,
        title: c.title,
        cover: `/category-covers/${encodeURIComponent(c.id)}`,
      })),
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
    const normalizedTitle = normalizeGenre(title);
    const existingCategory = categories.find(
      (c) => c.title.toLowerCase() === normalizedTitle
    );
    
    if (existingCategory) {
      return res.status(409).json({ error: "Category already exists", category: existingCategory });
    }

    // Create the category (will return existing ID if somehow it exists by ID)
    const categoryId = ensureCategoryExists(metadataGamesDir, title);
    
    if (!categoryId) {
      return res.status(500).json({ error: "Failed to create category" });
    }

    // Get the created category
    const categoriesAfter = loadCategories(metadataGamesDir);
    const newCategory = categoriesAfter.find((c) => c.id === categoryId);
    
    if (!newCategory) {
      return res.status(500).json({ error: "Category was created but not found" });
    }
    
    res.json({
      category: {
        id: newCategory.id,
        title: newCategory.title,
        cover: `/category-covers/${encodeURIComponent(newCategory.id)}`,
      },
    });
  });

  // Endpoint: delete category (only if not used by any game)
  app.delete("/categories/:categoryId", requireToken, (req, res) => {
    const categoryId = decodeURIComponent(req.params.categoryId);
    const categories = loadCategories(metadataGamesDir);
    
    // Find the category
    const categoryIndex = categories.findIndex((c) => c.id === categoryId);
    if (categoryIndex === -1) {
      return res.status(404).json({ error: "Category not found" });
    }

    const category = categories[categoryIndex];
    const categoryIdToCheck = category.id;
    const categoryTitleToCheck = category.title;

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

    // Check if category is used by any game (check both ID and title)
    const isUsed = Object.values(allGamesFromFile).some((game) => {
      if (!game.genre) return false;
      if (Array.isArray(game.genre)) {
        return game.genre.some((g) => 
          g === categoryIdToCheck || 
          g === categoryTitleToCheck ||
          g.toLowerCase() === categoryIdToCheck.toLowerCase() ||
          g.toLowerCase() === categoryTitleToCheck.toLowerCase()
        );
      }
      const genreStr = String(game.genre);
      return genreStr === categoryIdToCheck || 
             genreStr === categoryTitleToCheck ||
             genreStr.toLowerCase() === categoryIdToCheck.toLowerCase() ||
             genreStr.toLowerCase() === categoryTitleToCheck.toLowerCase();
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
      const categoryContentDir = path.join(metadataPath, "content", "categories", categoryId);
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
 * @param {string} categoryId - Category ID to delete
 * @param {Object} allGamesFromFile - Object with all games (gameId -> game object)
 * @returns {boolean} - True if category was deleted, false if it's still in use
 */
function deleteCategoryIfUnused(metadataPath, metadataGamesDir, categoryId, allGamesFromFile) {
  const categories = loadCategories(metadataGamesDir);
  
  // Find the category
  const categoryIndex = categories.findIndex((c) => c.id === categoryId);
  if (categoryIndex === -1) {
    return false; // Category not found
  }

  const category = categories[categoryIndex];
  const categoryIdToCheck = category.id;
  const categoryTitleToCheck = category.title;

  // Check if category is used by any game (check both ID and title)
  const isUsed = Object.values(allGamesFromFile).some((game) => {
    if (!game.genre) return false;
    if (Array.isArray(game.genre)) {
      return game.genre.some((g) => 
        g === categoryIdToCheck || 
        g === categoryTitleToCheck ||
        g.toLowerCase() === categoryIdToCheck.toLowerCase() ||
        g.toLowerCase() === categoryTitleToCheck.toLowerCase()
      );
    }
    const genreStr = String(game.genre);
    return genreStr === categoryIdToCheck || 
           genreStr === categoryTitleToCheck ||
           genreStr.toLowerCase() === categoryIdToCheck.toLowerCase() ||
           genreStr.toLowerCase() === categoryTitleToCheck.toLowerCase();
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
    const categoryContentDir = path.join(metadataPath, "content", "categories", categoryId);
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
  normalizeGenre,
  normalizeGenres,
  ensureCategoryExists,
  deleteCategoryIfUnused,
  registerCategoriesRoutes,
};

