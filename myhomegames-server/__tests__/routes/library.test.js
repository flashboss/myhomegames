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
      expect(game).toHaveProperty('criticratings');
      expect(game).toHaveProperty('userratings');
    }
  });

  test('should return criticratings and userratings when present', async () => {
    // First get a game ID from the library
    const libraryResponse = await request(app)
      .get('/libraries/library/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    // Find a game with ratings (if any)
    const gameWithRatings = libraryResponse.body.games.find(g => {
      // We'll check by fetching the full game details
      return true; // Check all games
    });
    
    if (libraryResponse.body.games.length > 0) {
      // Try to find a game that has ratings by checking multiple games
      let foundGameWithRatings = null;
      
      for (const game of libraryResponse.body.games.slice(0, 10)) {
        const gameResponse = await request(app)
          .get(`/games/${game.id}`)
          .set('X-Auth-Token', 'test-token')
          .expect(200);
        
        if (gameResponse.body.criticratings !== null || gameResponse.body.userratings !== null) {
          foundGameWithRatings = gameResponse.body;
          break;
        }
      }
      
      if (foundGameWithRatings) {
        // Verify ratings are numbers between 0 and 10
        if (foundGameWithRatings.criticratings !== null) {
          expect(typeof foundGameWithRatings.criticratings).toBe('number');
          expect(foundGameWithRatings.criticratings).toBeGreaterThanOrEqual(0);
          expect(foundGameWithRatings.criticratings).toBeLessThanOrEqual(10);
        }
        
        if (foundGameWithRatings.userratings !== null) {
          expect(typeof foundGameWithRatings.userratings).toBe('number');
          expect(foundGameWithRatings.userratings).toBeGreaterThanOrEqual(0);
          expect(foundGameWithRatings.userratings).toBeLessThanOrEqual(10);
        }
      }
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

describe('PUT /games/:gameId', () => {
  test('should update a single field', async () => {
    // First get a game ID from the library
    const libraryResponse = await request(app)
      .get('/libraries/library/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (libraryResponse.body.games.length > 0) {
      const gameId = libraryResponse.body.games[0].id;
      
      const updateResponse = await request(app)
        .put(`/games/${gameId}`)
        .set('X-Auth-Token', 'test-token')
        .send({ title: 'Updated Title' })
        .expect(200);
      
      expect(updateResponse.body).toHaveProperty('status', 'success');
      expect(updateResponse.body).toHaveProperty('game');
      expect(updateResponse.body.game).toHaveProperty('title', 'Updated Title');
      
      // Verify the update persisted by fetching again
      const verifyResponse = await request(app)
        .get(`/games/${gameId}`)
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      expect(verifyResponse.body).toHaveProperty('title', 'Updated Title');
    }
  });

  test('should update multiple fields', async () => {
    // First get a game ID from the library
    const libraryResponse = await request(app)
      .get('/libraries/library/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (libraryResponse.body.games.length > 0) {
      const gameId = libraryResponse.body.games[0].id;
      
      const updateResponse = await request(app)
        .put(`/games/${gameId}`)
        .set('X-Auth-Token', 'test-token')
        .send({ 
          title: 'New Title',
          stars: 9 
        })
        .expect(200);
      
      expect(updateResponse.body).toHaveProperty('status', 'success');
      expect(updateResponse.body.game).toHaveProperty('title', 'New Title');
      expect(updateResponse.body.game).toHaveProperty('stars', 9);
    }
  });

  test('should ignore non-allowed fields', async () => {
    // First get a game ID from the library
    const libraryResponse = await request(app)
      .get('/libraries/library/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (libraryResponse.body.games.length > 0) {
      const gameId = libraryResponse.body.games[0].id;
      const originalTitle = libraryResponse.body.games[0].title;
      
      const updateResponse = await request(app)
        .put(`/games/${gameId}`)
        .set('X-Auth-Token', 'test-token')
        .send({ 
          title: 'Updated Title',
          invalidField: 'should be ignored',
          anotherInvalidField: 123
        })
        .expect(200);
      
      expect(updateResponse.body.game).toHaveProperty('title', 'Updated Title');
      expect(updateResponse.body.game).not.toHaveProperty('invalidField');
    }
  });

  test('should return 400 when no valid fields provided', async () => {
    // First get a game ID from the library
    const libraryResponse = await request(app)
      .get('/libraries/library/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (libraryResponse.body.games.length > 0) {
      const gameId = libraryResponse.body.games[0].id;
      
      const response = await request(app)
        .put(`/games/${gameId}`)
        .set('X-Auth-Token', 'test-token')
        .send({ 
          invalidField: 'should be ignored',
          anotherInvalidField: 123
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('error', 'No valid fields to update');
    }
  });

  test('should return 404 for non-existent game', async () => {
    const response = await request(app)
      .put('/games/non-existent-game-id')
      .set('X-Auth-Token', 'test-token')
      .send({ title: 'Updated Title' })
      .expect(404);
    
    expect(response.body).toHaveProperty('error', 'Game not found');
  });

  test('should return 404 for game not in library file', async () => {
    // Try to update a game that doesn't exist at all
    const response = await request(app)
      .put('/games/completely-nonexistent-game-id-12345')
      .set('X-Auth-Token', 'test-token')
      .send({ title: 'Updated Title' })
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
        .put(`/games/${gameId}`)
        .send({ title: 'Updated Title' })
        .expect(401);
      
      expect(response.body).toHaveProperty('error', 'Unauthorized');
    }
  });

  test('should return updated game data', async () => {
    // First get a game ID from the library
    const libraryResponse = await request(app)
      .get('/libraries/library/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (libraryResponse.body.games.length > 0) {
      const gameId = libraryResponse.body.games[0].id;
      
      const updateResponse = await request(app)
        .put(`/games/${gameId}`)
        .set('X-Auth-Token', 'test-token')
        .send({ title: 'Updated Title' })
        .expect(200);
      
      const game = updateResponse.body.game;
      expect(game).toHaveProperty('id');
      expect(game).toHaveProperty('title', 'Updated Title');
      // Verify that criticratings and userratings are included in the response
      expect(game).toHaveProperty('criticratings');
      expect(game).toHaveProperty('userratings');
    }
  });

  test('should preserve criticratings and userratings after update', async () => {
    // First get a game ID from the library
    const libraryResponse = await request(app)
      .get('/libraries/library/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (libraryResponse.body.games.length > 0) {
      // Find a game with ratings
      let gameWithRatings = null;
      let gameId = null;
      
      for (const game of libraryResponse.body.games.slice(0, 10)) {
        const gameResponse = await request(app)
          .get(`/games/${game.id}`)
          .set('X-Auth-Token', 'test-token')
          .expect(200);
        
        if (gameResponse.body.criticratings !== null || gameResponse.body.userratings !== null) {
          gameWithRatings = gameResponse.body;
          gameId = game.id;
          break;
        }
      }
      
      if (gameWithRatings) {
        const originalCriticRatings = gameWithRatings.criticratings;
        const originalUserRatings = gameWithRatings.userratings;
        
        // Update a different field
        const updateResponse = await request(app)
          .put(`/games/${gameId}`)
          .set('X-Auth-Token', 'test-token')
          .send({ title: 'Updated Title' })
          .expect(200);
        
        // Verify ratings are preserved
        expect(updateResponse.body.game).toHaveProperty('criticratings', originalCriticRatings);
        expect(updateResponse.body.game).toHaveProperty('userratings', originalUserRatings);
      }
    }
  });
});

describe('POST /games/:gameId/reload', () => {
  test('should reload metadata for a single game', async () => {
    // First get a game ID from the library
    const libraryResponse = await request(app)
      .get('/libraries/library/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (libraryResponse.body.games.length > 0) {
      const gameId = libraryResponse.body.games[0].id;
      
      const response = await request(app)
        .post(`/games/${gameId}/reload`)
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'reloaded');
      expect(response.body).toHaveProperty('game');
      expect(response.body.game).toHaveProperty('id', gameId);
      expect(response.body.game).toHaveProperty('title');
      expect(response.body.game).toHaveProperty('summary');
      expect(response.body.game).toHaveProperty('cover');
    }
  });

  test('should return game with correct structure after reload', async () => {
    // First get a game ID from the library
    const libraryResponse = await request(app)
      .get('/libraries/library/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (libraryResponse.body.games.length > 0) {
      const gameId = libraryResponse.body.games[0].id;
      
      const response = await request(app)
        .post(`/games/${gameId}/reload`)
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      const game = response.body.game;
      expect(game).toHaveProperty('id');
      expect(game).toHaveProperty('title');
      expect(game).toHaveProperty('summary');
      expect(game).toHaveProperty('cover');
      expect(game.cover).toContain('/covers/');
      expect(game).toHaveProperty('day');
      expect(game).toHaveProperty('month');
      expect(game).toHaveProperty('year');
      expect(game).toHaveProperty('stars');
      expect(game).toHaveProperty('genre');
      expect(game).toHaveProperty('criticratings');
      expect(game).toHaveProperty('userratings');
    }
  });

  test('should return 404 for non-existent game', async () => {
    const response = await request(app)
      .post('/games/non-existent-game-id/reload')
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
        .post(`/games/${gameId}/reload`)
        .expect(401);
      
      expect(response.body).toHaveProperty('error', 'Unauthorized');
    }
  });
});

