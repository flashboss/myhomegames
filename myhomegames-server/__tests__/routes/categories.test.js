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

  test('should return categories with correct structure', async () => {
    const response = await request(app)
      .get('/categories')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (response.body.categories.length > 0) {
      const category = response.body.categories[0];
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('title');
      expect(category).toHaveProperty('cover');
      expect(category.cover).toContain('/category-covers/');
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
    expect(response.body.category).toHaveProperty('id');
    expect(response.body.category).toHaveProperty('title', 'testcategory');
    expect(response.body.category).toHaveProperty('cover');
    
    // Verify category was added to the list
    const listResponse = await request(app)
      .get('/categories')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    const createdCategory = listResponse.body.categories.find(
      c => c.id === response.body.category.id
    );
    expect(createdCategory).toBeDefined();
    expect(createdCategory.title).toBe('testcategory');
  });

  test('should generate correct ID format', async () => {
    const response = await request(app)
      .post('/categories')
      .set('X-Auth-Token', 'test-token')
      .send({ title: 'New Test Category' })
      .expect(200);
    
    expect(response.body.category.id).toMatch(/^genre_/);
    expect(response.body.category.id).toBe('genre_new_test_category');
  });

  test('should normalize title to lowercase', async () => {
    const response = await request(app)
      .post('/categories')
      .set('X-Auth-Token', 'test-token')
      .send({ title: 'UPPERCASE CATEGORY' })
      .expect(200);
    
    expect(response.body.category.title).toBe('uppercase category');
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

describe('DELETE /categories/:categoryId', () => {
  test('should delete unused category', async () => {
    // First create a category
    const createResponse = await request(app)
      .post('/categories')
      .set('X-Auth-Token', 'test-token')
      .send({ title: 'unusedcategory' })
      .expect(200);
    
    const categoryId = createResponse.body.category.id;
    
    // Delete the category
    const deleteResponse = await request(app)
      .delete(`/categories/${categoryId}`)
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    expect(deleteResponse.body).toHaveProperty('status', 'success');
    
    // Verify category was removed from the list
    const listResponse = await request(app)
      .get('/categories')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    const deletedCategory = listResponse.body.categories.find(
      c => c.id === categoryId
    );
    expect(deletedCategory).toBeUndefined();
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
        const categoryId = categoriesResponse.body.categories[0].id;
        
        // Assign category to a game
        await request(app)
          .put(`/games/${gameId}`)
          .set('X-Auth-Token', 'test-token')
          .send({ genre: [categoryId] })
          .expect(200);
        
        // Try to delete the category (should fail)
        const deleteResponse = await request(app)
          .delete(`/categories/${categoryId}`)
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
      .delete('/categories/nonexistent_category_id')
      .set('X-Auth-Token', 'test-token')
      .expect(404);
    
    expect(response.body).toHaveProperty('error', 'Category not found');
  });

  test('should require authentication', async () => {
    const response = await request(app)
      .delete('/categories/some_category_id')
      .expect(401);
    
    expect(response.body).toHaveProperty('error', 'Unauthorized');
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
      
      const newCategoryId = createCategoryResponse.body.category.id;
      
      // Update game with the new genre
      const updateResponse = await request(app)
        .put(`/games/${gameId}`)
        .set('X-Auth-Token', 'test-token')
        .send({ genre: [newCategoryId] })
        .expect(200);
      
      expect(updateResponse.body.game).toHaveProperty('genre');
      expect(Array.isArray(updateResponse.body.game.genre)).toBe(true);
      expect(updateResponse.body.game.genre).toContain(newCategoryId);
      
      // Verify category still exists
      const categoriesResponse = await request(app)
        .get('/categories')
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      const categoryExists = categoriesResponse.body.categories.some(
        c => c.id === newCategoryId
      );
      expect(categoryExists).toBe(true);
      
      // Cleanup: remove genre from game and delete category
      await request(app)
        .put(`/games/${gameId}`)
        .set('X-Auth-Token', 'test-token')
        .send({ genre: [] })
        .expect(200);
      
      await request(app)
        .delete(`/categories/${newCategoryId}`)
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
      
      const categoryId = createCategoryResponse.body.category.id;
      
      // Assign category to game
      await request(app)
        .put(`/games/${gameId}`)
        .set('X-Auth-Token', 'test-token')
        .send({ genre: [categoryId] })
        .expect(200);
      
      // Verify category cannot be deleted while in use
      const deleteWhileInUseResponse = await request(app)
        .delete(`/categories/${categoryId}`)
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
        .delete(`/categories/${categoryId}`)
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      expect(deleteResponse.body).toHaveProperty('status', 'success');
      
      // Verify category was removed
      const categoriesResponse = await request(app)
        .get('/categories')
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      const categoryExists = categoriesResponse.body.categories.some(
        c => c.id === categoryId
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
    const categoryId = ensureCategoryExists(metadataGamesDir, 'Helper Test Genre');
    
    expect(categoryId).toBeTruthy();
    expect(categoryId).toBe('genre_helper_test_genre');
    
    // Verify category was created
    const categoriesAfter = await request(app)
      .get('/categories')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    expect(categoriesAfter.body.categories.length).toBe(initialCount + 1);
    
    const createdCategory = categoriesAfter.body.categories.find(c => c.id === categoryId);
    expect(createdCategory).toBeDefined();
    expect(createdCategory.title).toBe('helper test genre');
    
    // Cleanup: delete the category
    await request(app)
      .delete(`/categories/${categoryId}`)
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
    
    const existingCategoryId = createResponse.body.category.id;
    
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
    const categoryId = ensureCategoryExists(metadataGamesDir, 'Existing Helper Genre');
    
    expect(categoryId).toBe(existingCategoryId);
    
    // Verify no duplicate was created
    const categoriesAfter = await request(app)
      .get('/categories')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    expect(categoriesAfter.body.categories.length).toBe(initialCount);
    
    // Cleanup: delete the category
    await request(app)
      .delete(`/categories/${existingCategoryId}`)
      .set('X-Auth-Token', 'test-token')
      .expect(200);
  });

  test('should normalize title to lowercase', async () => {
    // Import the helper function
    const { ensureCategoryExists } = require('../../routes/categories');
    const { testMetadataPath } = require('../setup');
    const path = require('path');
    const metadataGamesDir = path.join(testMetadataPath, 'metadata');
    
    // Create category with uppercase title
    const categoryId = ensureCategoryExists(metadataGamesDir, 'UPPERCASE HELPER GENRE');
    
    expect(categoryId).toBeTruthy();
    
    // Verify category was created with lowercase title
    const categoriesResponse = await request(app)
      .get('/categories')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    const createdCategory = categoriesResponse.body.categories.find(c => c.id === categoryId);
    expect(createdCategory).toBeDefined();
    expect(createdCategory.title).toBe('uppercase helper genre');
    
    // Cleanup: delete the category
    await request(app)
      .delete(`/categories/${categoryId}`)
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

describe('normalizeGenre helper function', () => {
  test('should normalize a single genre to lowercase', () => {
    const { normalizeGenre } = require('../../routes/categories');
    
    expect(normalizeGenre('Action')).toBe('action');
    expect(normalizeGenre('ADVENTURE')).toBe('adventure');
    expect(normalizeGenre('RPG')).toBe('rpg');
    expect(normalizeGenre('  Shooter  ')).toBe('shooter');
    expect(normalizeGenre('Role-Playing Game')).toBe('role-playing game');
  });

  test('should return null for invalid input', () => {
    const { normalizeGenre } = require('../../routes/categories');
    
    expect(normalizeGenre(null)).toBeNull();
    expect(normalizeGenre(undefined)).toBeNull();
    expect(normalizeGenre('')).toBeNull();
    expect(normalizeGenre('   ')).toBeNull();
    expect(normalizeGenre(123)).toBeNull();
    expect(normalizeGenre([])).toBeNull();
  });
});

describe('normalizeGenres helper function', () => {
  test('should normalize an array of genres to lowercase', () => {
    const { normalizeGenres } = require('../../routes/categories');
    
    const result = normalizeGenres(['Action', 'ADVENTURE', 'RPG']);
    expect(result).toEqual(['action', 'adventure', 'rpg']);
  });

  test('should trim whitespace from genres', () => {
    const { normalizeGenres } = require('../../routes/categories');
    
    const result = normalizeGenres(['  Action  ', '  Adventure  ', '  RPG  ']);
    expect(result).toEqual(['action', 'adventure', 'rpg']);
  });

  test('should filter out invalid genres', () => {
    const { normalizeGenres } = require('../../routes/categories');
    
    const result = normalizeGenres(['Action', '', '   ', 'Adventure', null, 'RPG']);
    expect(result).toEqual(['action', 'adventure', 'rpg']);
  });

  test('should return null for empty array', () => {
    const { normalizeGenres } = require('../../routes/categories');
    
    expect(normalizeGenres([])).toBeNull();
    expect(normalizeGenres(null)).toBeNull();
    expect(normalizeGenres(undefined)).toBeNull();
  });

  test('should return null if all genres are invalid', () => {
    const { normalizeGenres } = require('../../routes/categories');
    
    expect(normalizeGenres(['', '   ', null])).toBeNull();
  });

  test('should handle single genre array', () => {
    const { normalizeGenres } = require('../../routes/categories');
    
    const result = normalizeGenres(['Action']);
    expect(result).toEqual(['action']);
  });
});

