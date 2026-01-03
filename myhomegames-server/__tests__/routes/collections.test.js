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

describe('GET /collections', () => {
  test('should return list of collections', async () => {
    const response = await request(app)
      .get('/collections')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    expect(response.body).toHaveProperty('collections');
    expect(Array.isArray(response.body.collections)).toBe(true);
  });

  test('should return collections with correct structure', async () => {
    const response = await request(app)
      .get('/collections')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (response.body.collections.length > 0) {
      const collection = response.body.collections[0];
      expect(collection).toHaveProperty('id');
      expect(collection).toHaveProperty('title');
      expect(collection).toHaveProperty('cover');
      expect(collection.cover).toContain('/collection-covers/');
    }
  });

  test('should require authentication', async () => {
    const response = await request(app)
      .get('/collections')
      .expect(401);
    
    expect(response.body).toHaveProperty('error', 'Unauthorized');
  });
});

describe('GET /collections/:id', () => {
  test('should return a single collection by ID', async () => {
    // First get a collection ID from the list
    const collectionsResponse = await request(app)
      .get('/collections')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (collectionsResponse.body.collections.length > 0) {
      const collectionId = collectionsResponse.body.collections[0].id;
      
      const response = await request(app)
        .get(`/collections/${collectionId}`)
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      expect(response.body).toHaveProperty('id', collectionId);
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('cover');
      expect(response.body.cover).toContain('/collection-covers/');
    }
  });

  test('should return collection with correct structure', async () => {
    // First get a collection ID from the list
    const collectionsResponse = await request(app)
      .get('/collections')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (collectionsResponse.body.collections.length > 0) {
      const collectionId = collectionsResponse.body.collections[0].id;
      
      const response = await request(app)
        .get(`/collections/${collectionId}`)
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      const collection = response.body;
      expect(collection).toHaveProperty('id');
      expect(collection).toHaveProperty('title');
      expect(collection).toHaveProperty('summary');
      expect(collection).toHaveProperty('cover');
      expect(collection).toHaveProperty('gameCount');
      expect(typeof collection.gameCount).toBe('number');
    }
  });

  test('should return 404 for non-existent collection', async () => {
    const response = await request(app)
      .get('/collections/non-existent-collection-id')
      .set('X-Auth-Token', 'test-token')
      .expect(404);
    
    expect(response.body).toHaveProperty('error', 'Collection not found');
  });

  test('should require authentication', async () => {
    // First get a collection ID from the list
    const collectionsResponse = await request(app)
      .get('/collections')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (collectionsResponse.body.collections.length > 0) {
      const collectionId = collectionsResponse.body.collections[0].id;
      
      const response = await request(app)
        .get(`/collections/${collectionId}`)
        .expect(401);
      
      expect(response.body).toHaveProperty('error', 'Unauthorized');
    }
  });

  test('should handle URL-encoded collection IDs', async () => {
    // First get a collection ID from the list
    const collectionsResponse = await request(app)
      .get('/collections')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (collectionsResponse.body.collections.length > 0) {
      const collectionId = collectionsResponse.body.collections[0].id;
      const encodedCollectionId = encodeURIComponent(collectionId);
      
      const response = await request(app)
        .get(`/collections/${encodedCollectionId}`)
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      expect(response.body).toHaveProperty('id', collectionId);
    }
  });
});

describe('GET /collections/:id/games', () => {
  test('should return games for a valid collection', async () => {
    const response = await request(app)
      .get('/collections/collection_test_1/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    expect(response.body).toHaveProperty('games');
    expect(Array.isArray(response.body.games)).toBe(true);
  });

  test('should return 404 for non-existent collection', async () => {
    const response = await request(app)
      .get('/collections/nonexistent/games')
      .set('X-Auth-Token', 'test-token')
      .expect(404);
    
    expect(response.body).toHaveProperty('error', 'Collection not found');
  });

  test('should return games with correct structure', async () => {
    const response = await request(app)
      .get('/collections/collection_test_1/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (response.body.games.length > 0) {
      const game = response.body.games[0];
      expect(game).toHaveProperty('id');
      expect(game).toHaveProperty('title');
      expect(game).toHaveProperty('summary');
      expect(game).toHaveProperty('cover');
      expect(game.cover).toContain('/covers/');
    }
  });

  test('should require authentication', async () => {
    const response = await request(app)
      .get('/collections/collection_test_1/games')
      .expect(401);
    
    expect(response.body).toHaveProperty('error', 'Unauthorized');
  });
});

describe('PUT /collections/:id', () => {
  test('should update a single field', async () => {
    const collectionId = 'collection_test_1';
    const response = await request(app)
      .put(`/collections/${collectionId}`)
      .set('X-Auth-Token', 'test-token')
      .send({ title: 'Updated Title' })
      .expect(200);

    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body.collection).toHaveProperty('id', collectionId);
    expect(response.body.collection).toHaveProperty('title', 'Updated Title');
  });

  test('should update multiple fields', async () => {
    const collectionId = 'collection_test_2';
    const updates = { title: 'Updated Title', summary: 'Updated Summary' };
    const response = await request(app)
      .put(`/collections/${collectionId}`)
      .set('X-Auth-Token', 'test-token')
      .send(updates)
      .expect(200);

    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body.collection).toHaveProperty('id', collectionId);
    expect(response.body.collection).toHaveProperty('title', 'Updated Title');
    expect(response.body.collection).toHaveProperty('summary', 'Updated Summary');
  });

  test('should ignore non-allowed fields', async () => {
    const collectionId = 'collection_test_1';
    const updates = { title: 'New Title', unknownField: 'value' };
    const response = await request(app)
      .put(`/collections/${collectionId}`)
      .set('X-Auth-Token', 'test-token')
      .send(updates)
      .expect(200);

    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body.collection).toHaveProperty('title', 'New Title');
    expect(response.body.collection).not.toHaveProperty('unknownField');
  });

  test('should return 400 when no valid fields provided', async () => {
    const collectionId = 'collection_test_1';
    const response = await request(app)
      .put(`/collections/${collectionId}`)
      .set('X-Auth-Token', 'test-token')
      .send({ unknownField: 'value' })
      .expect(400);

    expect(response.body).toHaveProperty('error', 'No valid fields to update');
  });

  test('should return 404 for non-existent collection', async () => {
    const response = await request(app)
      .put('/collections/non-existent-collection-id')
      .set('X-Auth-Token', 'test-token')
      .send({ title: 'New Title' })
      .expect(404);

    expect(response.body).toHaveProperty('error', 'Collection not found');
  });

  test('should require authentication', async () => {
    const collectionId = 'collection_test_1';
    const response = await request(app)
      .put(`/collections/${collectionId}`)
      .send({ title: 'New Title' })
      .expect(401);

    expect(response.body).toHaveProperty('error', 'Unauthorized');
  });

  test('should return updated collection data', async () => {
    const collectionId = 'collection_test_1';
    const response = await request(app)
      .put(`/collections/${collectionId}`)
      .set('X-Auth-Token', 'test-token')
      .send({ title: 'Updated Title' })
      .expect(200);

    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body.collection).toHaveProperty('title', 'Updated Title');
    expect(response.body.collection).toHaveProperty('gameCount');
  });
});

describe('DELETE /collections/:id', () => {
  test('should delete a collection', async () => {
    // First get a collection ID from the list
    const collectionsResponse = await request(app)
      .get('/collections')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (collectionsResponse.body.collections.length > 0) {
      const collectionId = collectionsResponse.body.collections[0].id;
      
      // Delete the collection
      const deleteResponse = await request(app)
        .delete(`/collections/${collectionId}`)
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      expect(deleteResponse.body).toHaveProperty('status', 'success');
      
      // Verify collection is deleted by trying to get it
      const getResponse = await request(app)
        .get(`/collections/${collectionId}`)
        .set('X-Auth-Token', 'test-token')
        .expect(404);
      
      expect(getResponse.body).toHaveProperty('error', 'Collection not found');
    }
  });

  test('should return 404 for non-existent collection', async () => {
    const response = await request(app)
      .delete('/collections/non-existent-collection-id')
      .set('X-Auth-Token', 'test-token')
      .expect(404);
    
    expect(response.body).toHaveProperty('error', 'Collection not found');
  });

  test('should require authentication', async () => {
    // First get a collection ID from the list
    const collectionsResponse = await request(app)
      .get('/collections')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (collectionsResponse.body.collections.length > 0) {
      const collectionId = collectionsResponse.body.collections[0].id;
      
      const response = await request(app)
        .delete(`/collections/${collectionId}`)
        .expect(401);
      
      expect(response.body).toHaveProperty('error', 'Unauthorized');
    }
  });

  test('should delete collection content directory', async () => {
    // First get a collection ID from the list
    const collectionsResponse = await request(app)
      .get('/collections')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (collectionsResponse.body.collections.length > 0) {
      const collectionId = collectionsResponse.body.collections[0].id;
      const { testMetadataPath } = require('../setup');
      const fs = require('fs');
      const path = require('path');
      
      // Create a test content directory for the collection
      const collectionContentDir = path.join(testMetadataPath, 'content', 'collections', collectionId);
      if (!fs.existsSync(collectionContentDir)) {
        fs.mkdirSync(collectionContentDir, { recursive: true });
      }
      
      // Create a test file in the directory
      const testFile = path.join(collectionContentDir, 'test.txt');
      fs.writeFileSync(testFile, 'test content');
      
      // Verify the directory exists before deletion
      expect(fs.existsSync(collectionContentDir)).toBe(true);
      
      // Delete the collection
      const response = await request(app)
        .delete(`/collections/${collectionId}`)
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'success');
      
      // Verify the directory was deleted
      expect(fs.existsSync(collectionContentDir)).toBe(false);
    }
  });

  test('should handle URL-encoded collection IDs', async () => {
    // First get a collection ID from the list
    const collectionsResponse = await request(app)
      .get('/collections')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (collectionsResponse.body.collections.length > 0) {
      const collectionId = collectionsResponse.body.collections[0].id;
      const encodedCollectionId = encodeURIComponent(collectionId);
      
      // Delete the collection
      const deleteResponse = await request(app)
        .delete(`/collections/${encodedCollectionId}`)
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      expect(deleteResponse.body).toHaveProperty('status', 'success');
    }
  });
});

describe('POST /collections/:id/reload', () => {
  test('should reload metadata for a single collection', async () => {
    // First get a collection ID from the list
    const collectionsResponse = await request(app)
      .get('/collections')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (collectionsResponse.body.collections.length > 0) {
      const collectionId = collectionsResponse.body.collections[0].id;
      
      const response = await request(app)
        .post(`/collections/${collectionId}/reload`)
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'reloaded');
      expect(response.body).toHaveProperty('collection');
      expect(response.body.collection).toHaveProperty('id', collectionId);
      expect(response.body.collection).toHaveProperty('title');
      expect(response.body.collection).toHaveProperty('summary');
      expect(response.body.collection).toHaveProperty('cover');
    }
  });

  test('should return collection with correct structure after reload', async () => {
    // First get a collection ID from the list
    const collectionsResponse = await request(app)
      .get('/collections')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (collectionsResponse.body.collections.length > 0) {
      const collectionId = collectionsResponse.body.collections[0].id;
      
      const response = await request(app)
        .post(`/collections/${collectionId}/reload`)
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      const collection = response.body.collection;
      expect(collection).toHaveProperty('id');
      expect(collection).toHaveProperty('title');
      expect(collection).toHaveProperty('summary');
      expect(collection).toHaveProperty('cover');
      expect(collection.cover).toContain('/collection-covers/');
    }
  });

  test('should return 404 for non-existent collection', async () => {
    const response = await request(app)
      .post('/collections/non-existent-collection-id/reload')
      .set('X-Auth-Token', 'test-token')
      .expect(404);
    
    expect(response.body).toHaveProperty('error', 'Collection not found');
  });

  test('should require authentication', async () => {
    // First get a collection ID from the list
    const collectionsResponse = await request(app)
      .get('/collections')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (collectionsResponse.body.collections.length > 0) {
      const collectionId = collectionsResponse.body.collections[0].id;
      
      const response = await request(app)
        .post(`/collections/${collectionId}/reload`)
        .expect(401);
      
      expect(response.body).toHaveProperty('error', 'Unauthorized');
    }
  });
});

