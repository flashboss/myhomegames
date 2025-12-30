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

function registerCategoriesRoutes(app, requireToken, metadataPath, metadataGamesDir) {
  // Endpoint: serve category cover image (public, no auth required for images)
  app.get("/category-covers/:categoryId", (req, res) => {
    const categoryId = decodeURIComponent(req.params.categoryId);
    const coverPath = path.join(metadataPath, "content", "categories", categoryId, "cover.webp");

    // Check if file exists
    if (!fs.existsSync(coverPath)) {
      return res.status(404).json({ error: "Cover not found" });
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
}

module.exports = {
  loadCategories,
  registerCategoriesRoutes,
};

