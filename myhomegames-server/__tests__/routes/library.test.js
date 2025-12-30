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

describe('GET /libraries/library/games', () => {
  test('should return games for library', async () => {
    const response = await request(app)
      .get('/libraries/library/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    expect(response.body).toHaveProperty('games');
    expect(Array.isArray(response.body.games)).toBe(true);
    expect(response.body.games.length).toBeGreaterThan(0);
  });

  test('should return games with correct structure', async () => {
    const response = await request(app)
      .get('/libraries/library/games')
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

  test('should include optional fields when present', async () => {
    const response = await request(app)
      .get('/libraries/library/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    const gameWithStars = response.body.games.find(g => g.stars);
    if (gameWithStars) {
      expect(typeof gameWithStars.stars).toBe('number');
    }
  });

  test('should require authentication', async () => {
    const response = await request(app)
      .get('/libraries/library/games')
      .expect(401);
    
    expect(response.body).toHaveProperty('error', 'Unauthorized');
  });
});

describe('GET /games/:gameId', () => {
  test('should return a single game by ID', async () => {
    // First get a game ID from the library
    const libraryResponse = await request(app)
      .get('/libraries/library/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (libraryResponse.body.games.length > 0) {
      const gameId = libraryResponse.body.games[0].id;
      
      const response = await request(app)
        .get(`/games/${gameId}`)
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      expect(response.body).toHaveProperty('id', gameId);
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('cover');
      expect(response.body.cover).toContain('/covers/');
    }
  });

  test('should return game with correct structure', async () => {
    // First get a game ID from the library
    const libraryResponse = await request(app)
      .get('/libraries/library/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (libraryResponse.body.games.length > 0) {
      const gameId = libraryResponse.body.games[0].id;
      
      const response = await request(app)
        .get(`/games/${gameId}`)
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      const game = response.body;
      expect(game).toHaveProperty('id');
      expect(game).toHaveProperty('title');
      expect(game).toHaveProperty('summary');
      expect(game).toHaveProperty('cover');
      
      // Optional fields should be present but can be null
      expect(game).toHaveProperty('day');
      expect(game).toHaveProperty('month');
      expect(game).toHaveProperty('year');
      expect(game).toHaveProperty('stars');
      expect(game).toHaveProperty('genre');
    }
  });

  test('should return 404 for non-existent game', async () => {
    const response = await request(app)
      .get('/games/non-existent-game-id')
      .set('X-Auth-Token', 'test-token')
      .expect(404);
    
    expect(response.body).toHaveProperty('error', 'Game not found');
  });

  test('should require authentication', async () => {
    // First get a game ID from the library
    const libraryResponse = await request(app)
      .get('/libraries/library/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (libraryResponse.body.games.length > 0) {
      const gameId = libraryResponse.body.games[0].id;
      
      const response = await request(app)
        .get(`/games/${gameId}`)
        .expect(401);
      
      expect(response.body).toHaveProperty('error', 'Unauthorized');
    }
  });

  test('should handle URL-encoded game IDs', async () => {
    // First get a game ID from the library
    const libraryResponse = await request(app)
      .get('/libraries/library/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (libraryResponse.body.games.length > 0) {
      const gameId = libraryResponse.body.games[0].id;
      const encodedGameId = encodeURIComponent(gameId);
      
      const response = await request(app)
        .get(`/games/${encodedGameId}`)
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      expect(response.body).toHaveProperty('id', gameId);
    }
  });
});

