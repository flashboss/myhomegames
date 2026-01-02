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

    const categories = loadCategories(metadataGamesDir);
    const normalizedTitle = title.trim().toLowerCase();
    
    // Check if category already exists (by title)
    const existingCategory = categories.find(
      (c) => c.title.toLowerCase() === normalizedTitle
    );
    
    if (existingCategory) {
      return res.status(409).json({ error: "Category already exists", category: existingCategory });
    }

    // Generate ID: genre_<normalized_title>
    const newId = `genre_${normalizedTitle.replace(/\s+/g, "_")}`;
    
    // Check if ID already exists
    const existingById = categories.find((c) => c.id === newId);
    if (existingById) {
      return res.status(409).json({ error: "Category ID already exists", category: existingById });
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
      res.json({
        category: {
          id: newCategory.id,
          title: newCategory.title,
          cover: `/category-covers/${encodeURIComponent(newCategory.id)}`,
        },
      });
    } catch (e) {
      console.error(`Failed to save ${fileName}:`, e.message);
      res.status(500).json({ error: "Failed to save category" });
    }
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
      res.json({ status: "success", message: "Category deleted" });
    } catch (e) {
      console.error(`Failed to save ${fileName}:`, e.message);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });
}

module.exports = {
  loadCategories,
  registerCategoriesRoutes,
};

