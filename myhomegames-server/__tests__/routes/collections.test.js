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

