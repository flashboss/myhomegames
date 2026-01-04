const request = require('supertest');

// Import setup first to set environment variables
const { testMetadataPath } = require('../setup');

// Import server after setting up environment
let app;

beforeAll(() => {
  // Clear module cache to ensure fresh server instance
  delete require.cache[require.resolve('../../server.js')];
  app = require('../../server.js');
});

afterAll(async () => {
  // Give time for any pending async operations to complete
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Force garbage collection if available (helps with cleanup)
  if (global.gc) {
    global.gc();
  }
});

describe('GET /categories', () => {
  test('should return list of categories', async () => {
    const response = await request(app)
      .get('/categories')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    expect(response.body).toHaveProperty('categories');
    expect(Array.isArray(response.body.categories)).toBe(true);
  });

  test('should return categories as array of strings', async () => {
    const response = await request(app)
      .get('/categories')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    expect(response.body).toHaveProperty('categories');
    expect(Array.isArray(response.body.categories)).toBe(true);
    
    if (response.body.categories.length > 0) {
      // All categories should be strings
      response.body.categories.forEach(category => {
        expect(typeof category).toBe('string');
      });
    }
  });

  test('should require authentication', async () => {
    const response = await request(app)
      .get('/categories')
      .expect(401);
    
    expect(response.body).toHaveProperty('error', 'Unauthorized');
  });
});

describe('POST /categories', () => {
  test('should create a new category', async () => {
    const response = await request(app)
      .post('/categories')
      .set('X-Auth-Token', 'test-token')
      .send({ title: 'testcategory' })
      .expect(200);
    
    expect(response.body).toHaveProperty('category');
    expect(typeof response.body.category).toBe('string');
    expect(response.body.category).toBe('testcategory');
    
    // Verify category was added to the list
    const listResponse = await request(app)
      .get('/categories')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    expect(listResponse.body.categories).toContain('testcategory');
  });

  test('should return category title as string', async () => {
    const response = await request(app)
      .post('/categories')
      .set('X-Auth-Token', 'test-token')
      .send({ title: 'New Test Category' })
      .expect(200);
    
    expect(typeof response.body.category).toBe('string');
    expect(response.body.category).toBe('New Test Category');
  });

  test('should preserve title case', async () => {
    const response = await request(app)
      .post('/categories')
      .set('X-Auth-Token', 'test-token')
      .send({ title: 'UPPERCASE CATEGORY' })
      .expect(200);
    
    expect(response.body.category).toBe('UPPERCASE CATEGORY');
  });

  test('should return 409 if category already exists', async () => {
    // First create a category
    await request(app)
      .post('/categories')
      .set('X-Auth-Token', 'test-token')
      .send({ title: 'duplicate' })
      .expect(200);
    
    // Try to create it again
    const response = await request(app)
      .post('/categories')
      .set('X-Auth-Token', 'test-token')
      .send({ title: 'duplicate' })
      .expect(409);
    
    expect(response.body).toHaveProperty('error', 'Category already exists');
  });

  test('should return 400 if title is missing', async () => {
    const response = await request(app)
      .post('/categories')
      .set('X-Auth-Token', 'test-token')
      .send({})
      .expect(400);
    
    expect(response.body).toHaveProperty('error', 'Title is required');
  });

  test('should return 400 if title is empty', async () => {
    const response = await request(app)
      .post('/categories')
      .set('X-Auth-Token', 'test-token')
      .send({ title: '   ' })
      .expect(400);
    
    expect(response.body).toHaveProperty('error', 'Title is required');
  });

  test('should require authentication', async () => {
    const response = await request(app)
      .post('/categories')
      .send({ title: 'test' })
      .expect(401);
    
    expect(response.body).toHaveProperty('error', 'Unauthorized');
  });
});

describe('DELETE /categories/:categoryTitle', () => {
  test('should delete unused category', async () => {
    // First create a category
    const createResponse = await request(app)
      .post('/categories')
      .set('X-Auth-Token', 'test-token')
      .send({ title: 'unusedcategory' })
      .expect(200);
    
    const categoryTitle = createResponse.body.category;
    
    // Delete the category
    const deleteResponse = await request(app)
      .delete(`/categories/${encodeURIComponent(categoryTitle)}`)
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    expect(deleteResponse.body).toHaveProperty('status', 'success');
    
    // Verify category was removed from the list
    const listResponse = await request(app)
      .get('/categories')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    expect(listResponse.body.categories).not.toContain(categoryTitle);
  });

  test('should return 409 if category is still in use', async () => {
    // Get a game from the library
    const libraryResponse = await request(app)
      .get('/libraries/library/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (libraryResponse.body.games.length > 0) {
      const gameId = libraryResponse.body.games[0].id;
      
      // Get existing categories
      const categoriesResponse = await request(app)
        .get('/categories')
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      if (categoriesResponse.body.categories.length > 0) {
        const categoryTitle = categoriesResponse.body.categories[0];
        
        // Assign category to a game
        await request(app)
          .put(`/games/${gameId}`)
          .set('X-Auth-Token', 'test-token')
          .send({ genre: [categoryTitle] })
          .expect(200);
        
        // Try to delete the category (should fail)
        const deleteResponse = await request(app)
          .delete(`/categories/${encodeURIComponent(categoryTitle)}`)
          .set('X-Auth-Token', 'test-token')
          .expect(409);
        
        expect(deleteResponse.body).toHaveProperty('error', 'Category is still in use by one or more games');
        
        // Cleanup: remove genre from game
        await request(app)
          .put(`/games/${gameId}`)
          .set('X-Auth-Token', 'test-token')
          .send({ genre: [] })
          .expect(200);
      }
    }
  });

  test('should return 404 if category does not exist', async () => {
    const response = await request(app)
      .delete('/categories/nonexistent_category')
      .set('X-Auth-Token', 'test-token')
      .expect(404);
    
    expect(response.body).toHaveProperty('error', 'Category not found');
  });

  test('should require authentication', async () => {
    const response = await request(app)
      .delete('/categories/some_category')
      .expect(401);
    
    expect(response.body).toHaveProperty('error', 'Unauthorized');
  });

  test('should delete category content directory', async () => {
    // First create a category
    const createResponse = await request(app)
      .post('/categories')
      .set('X-Auth-Token', 'test-token')
      .send({ title: 'testcategoryfordeletion' })
      .expect(200);
    
    const categoryTitle = createResponse.body.category;
    const { testMetadataPath } = require('../setup');
    const fs = require('fs');
    const path = require('path');
    
    // Create a test content directory for the category
    const categoryContentDir = path.join(testMetadataPath, 'content', 'categories', categoryTitle);
    if (!fs.existsSync(categoryContentDir)) {
      fs.mkdirSync(categoryContentDir, { recursive: true });
    }
    
    // Create a test file in the directory
    const testFile = path.join(categoryContentDir, 'test.txt');
    fs.writeFileSync(testFile, 'test content');
    
    // Verify the directory exists before deletion
    expect(fs.existsSync(categoryContentDir)).toBe(true);
    
    // Delete the category
    const response = await request(app)
      .delete(`/categories/${encodeURIComponent(categoryTitle)}`)
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    expect(response.body).toHaveProperty('status', 'success');
    
    // Verify the directory was deleted
    expect(fs.existsSync(categoryContentDir)).toBe(false);
  });
});

describe('Game update with category creation and deletion', () => {
  test('should create category when updating game with new genre', async () => {
    // Get a game from the library
    const libraryResponse = await request(app)
      .get('/libraries/library/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (libraryResponse.body.games.length > 0) {
      const gameId = libraryResponse.body.games[0].id;
      
      // Create a new category
      const createCategoryResponse = await request(app)
        .post('/categories')
        .set('X-Auth-Token', 'test-token')
        .send({ title: 'newtestgenre' })
        .expect(200);
      
      const newCategoryTitle = createCategoryResponse.body.category;
      
      // Update game with the new genre
      const updateResponse = await request(app)
        .put(`/games/${gameId}`)
        .set('X-Auth-Token', 'test-token')
        .send({ genre: [newCategoryTitle] })
        .expect(200);
      
      expect(updateResponse.body.game).toHaveProperty('genre');
      expect(Array.isArray(updateResponse.body.game.genre)).toBe(true);
      expect(updateResponse.body.game.genre).toContain(newCategoryTitle);
      
      // Verify category still exists
      const categoriesResponse = await request(app)
        .get('/categories')
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      expect(categoriesResponse.body.categories).toContain(newCategoryTitle);
      
      // Cleanup: remove genre from game and delete category
      await request(app)
        .put(`/games/${gameId}`)
        .set('X-Auth-Token', 'test-token')
        .send({ genre: [] })
        .expect(200);
      
      await request(app)
        .delete(`/categories/${encodeURIComponent(newCategoryTitle)}`)
        .set('X-Auth-Token', 'test-token')
        .expect(200);
    }
  });

  test('should allow deletion of category after removing from last game', async () => {
    // Get a game from the library
    const libraryResponse = await request(app)
      .get('/libraries/library/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (libraryResponse.body.games.length > 0) {
      const gameId = libraryResponse.body.games[0].id;
      
      // Create a new category
      const createCategoryResponse = await request(app)
        .post('/categories')
        .set('X-Auth-Token', 'test-token')
        .send({ title: 'temporarygenre' })
        .expect(200);
      
      const categoryTitle = createCategoryResponse.body.category;
      
      // Assign category to game
      await request(app)
        .put(`/games/${gameId}`)
        .set('X-Auth-Token', 'test-token')
        .send({ genre: [categoryTitle] })
        .expect(200);
      
      // Verify category cannot be deleted while in use
      const deleteWhileInUseResponse = await request(app)
        .delete(`/categories/${encodeURIComponent(categoryTitle)}`)
        .set('X-Auth-Token', 'test-token')
        .expect(409);
      
      expect(deleteWhileInUseResponse.body).toHaveProperty('error', 'Category is still in use by one or more games');
      
      // Remove category from game
      await request(app)
        .put(`/games/${gameId}`)
        .set('X-Auth-Token', 'test-token')
        .send({ genre: [] })
        .expect(200);
      
      // Now category should be deletable
      const deleteResponse = await request(app)
        .delete(`/categories/${encodeURIComponent(categoryTitle)}`)
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      expect(deleteResponse.body).toHaveProperty('status', 'success');
      
      // Verify category was removed
      const categoriesResponse = await request(app)
        .get('/categories')
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      const categoryExists = categoriesResponse.body.categories.some(
        c => c.title === categoryTitle
      );
      expect(categoryExists).toBe(false);
    }
  });
});

describe('ensureCategoryExists helper function', () => {
  test('should create category if it does not exist', async () => {
    // Get initial categories count
    const categoriesBefore = await request(app)
      .get('/categories')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    const initialCount = categoriesBefore.body.categories.length;
    
    // Import the helper function
    const { ensureCategoryExists } = require('../../routes/categories');
    const { testMetadataPath } = require('../setup');
    const path = require('path');
    const metadataGamesDir = path.join(testMetadataPath, 'metadata');
    
    // Create a new category using the helper
    const categoryTitle = ensureCategoryExists(metadataGamesDir, 'Helper Test Genre');
    
    expect(categoryTitle).toBeTruthy();
    expect(categoryTitle).toBe('Helper Test Genre');
    
    // Verify category was created
    const categoriesAfter = await request(app)
      .get('/categories')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    expect(categoriesAfter.body.categories.length).toBe(initialCount + 1);
    
    expect(categoriesAfter.body.categories).toContain('Helper Test Genre');
    
    // Cleanup: delete the category
    await request(app)
      .delete(`/categories/${encodeURIComponent(categoryTitle)}`)
      .set('X-Auth-Token', 'test-token')
      .expect(200);
  });

  test('should return existing category ID if category already exists', async () => {
    // First create a category via endpoint
    const createResponse = await request(app)
      .post('/categories')
      .set('X-Auth-Token', 'test-token')
      .send({ title: 'Existing Helper Genre' })
      .expect(200);
    
    const existingCategoryTitle = createResponse.body.category;
    
    // Get categories count before calling helper
    const categoriesBefore = await request(app)
      .get('/categories')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    const initialCount = categoriesBefore.body.categories.length;
    
    // Import the helper function
    const { ensureCategoryExists } = require('../../routes/categories');
    const { testMetadataPath } = require('../setup');
    const path = require('path');
    const metadataGamesDir = path.join(testMetadataPath, 'metadata');
    
    // Try to create the same category using the helper
    const categoryTitle = ensureCategoryExists(metadataGamesDir, 'Existing Helper Genre');
    
    expect(categoryTitle).toBe('Existing Helper Genre');
    
    // Verify no duplicate was created
    const categoriesAfter = await request(app)
      .get('/categories')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    expect(categoriesAfter.body.categories.length).toBe(initialCount);
    
    // Cleanup: delete the category
    await request(app)
      .delete(`/categories/${encodeURIComponent(categoryTitle)}`)
      .set('X-Auth-Token', 'test-token')
      .expect(200);
  });

  test('should preserve title case', async () => {
    // Import the helper function
    const { ensureCategoryExists } = require('../../routes/categories');
    const { testMetadataPath } = require('../setup');
    const path = require('path');
    const metadataGamesDir = path.join(testMetadataPath, 'metadata');
    
    // Create category with uppercase title
    const categoryTitle = ensureCategoryExists(metadataGamesDir, 'UPPERCASE HELPER GENRE');
    
    expect(categoryTitle).toBeTruthy();
    expect(categoryTitle).toBe('UPPERCASE HELPER GENRE');
    
    // Verify category was created with original case
    const categoriesResponse = await request(app)
      .get('/categories')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    expect(categoriesResponse.body.categories).toContain('UPPERCASE HELPER GENRE');
    
    // Cleanup: delete the category
    await request(app)
      .delete(`/categories/${encodeURIComponent(categoryTitle)}`)
      .set('X-Auth-Token', 'test-token')
      .expect(200);
  });

  test('should return null for invalid input', async () => {
    // Import the helper function
    const { ensureCategoryExists } = require('../../routes/categories');
    const { testMetadataPath } = require('../setup');
    const path = require('path');
    const metadataGamesDir = path.join(testMetadataPath, 'metadata');
    
    // Test with null
    expect(ensureCategoryExists(metadataGamesDir, null)).toBeNull();
    
    // Test with empty string
    expect(ensureCategoryExists(metadataGamesDir, '')).toBeNull();
    
    // Test with whitespace only
    expect(ensureCategoryExists(metadataGamesDir, '   ')).toBeNull();
    
    // Test with non-string
    expect(ensureCategoryExists(metadataGamesDir, 123)).toBeNull();
  });
});


