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

describe('POST /games/:gameId/upload-executable', () => {
  test('should upload a .sh file successfully', async () => {
    // First get a game ID from the library
    const libraryResponse = await request(app)
      .get('/libraries/library/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (libraryResponse.body.games.length > 0) {
      const gameId = libraryResponse.body.games[0].id;
      const fileContent = Buffer.from('#!/bin/bash\necho "Hello World"');
      
      const response = await request(app)
        .post(`/games/${gameId}/upload-executable`)
        .set('X-Auth-Token', 'test-token')
        .attach('file', fileContent, 'test-script.sh')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('game');
      expect(response.body.game).toHaveProperty('command', 'sh');
      expect(response.body.game).toHaveProperty('id', gameId);
      
      // Verify the file was saved
      const { testMetadataPath } = require('../setup');
      const fs = require('fs');
      const path = require('path');
      const scriptPath = path.join(testMetadataPath, 'content', 'games', String(gameId), 'script.sh');
      expect(fs.existsSync(scriptPath)).toBe(true);
      
      // Verify file content
      const savedContent = fs.readFileSync(scriptPath);
      expect(savedContent.toString()).toBe(fileContent.toString());
      
      // Verify command field was updated in JSON
      const gameResponse = await request(app)
        .get(`/games/${gameId}`)
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      expect(gameResponse.body).toHaveProperty('command', 'sh');
    }
  });

  test('should upload a .bat file successfully', async () => {
    // First get a game ID from the library
    const libraryResponse = await request(app)
      .get('/libraries/library/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (libraryResponse.body.games.length > 0) {
      const gameId = libraryResponse.body.games[0].id;
      const fileContent = Buffer.from('@echo off\necho Hello World');
      
      const response = await request(app)
        .post(`/games/${gameId}/upload-executable`)
        .set('X-Auth-Token', 'test-token')
        .attach('file', fileContent, 'test-script.bat')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body.game).toHaveProperty('command', 'bat');
      
      // Verify the file was saved as script.bat
      const { testMetadataPath } = require('../setup');
      const fs = require('fs');
      const path = require('path');
      const scriptPath = path.join(testMetadataPath, 'content', 'games', String(gameId), 'script.bat');
      expect(fs.existsSync(scriptPath)).toBe(true);
      
      // Verify file content
      const savedContent = fs.readFileSync(scriptPath);
      expect(savedContent.toString()).toBe(fileContent.toString());
    }
  });

  test('should reject files with invalid extensions', async () => {
    // First get a game ID from the library
    const libraryResponse = await request(app)
      .get('/libraries/library/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (libraryResponse.body.games.length > 0) {
      const gameId = libraryResponse.body.games[0].id;
      const fileContent = Buffer.from('some content');
      
      // Try uploading a .txt file
      const response = await request(app)
        .post(`/games/${gameId}/upload-executable`)
        .set('X-Auth-Token', 'test-token')
        .attach('file', fileContent, 'test-file.txt')
        .expect(400);
      
      expect(response.body).toHaveProperty('error', 'Only .sh and .bat files are allowed');
    }
  });

  test('should reject request without file', async () => {
    // First get a game ID from the library
    const libraryResponse = await request(app)
      .get('/libraries/library/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (libraryResponse.body.games.length > 0) {
      const gameId = libraryResponse.body.games[0].id;
      
      const response = await request(app)
        .post(`/games/${gameId}/upload-executable`)
        .set('X-Auth-Token', 'test-token')
        .expect(400);
      
      expect(response.body).toHaveProperty('error', 'No file uploaded');
    }
  });

  test('should return 404 for non-existent game', async () => {
    const fileContent = Buffer.from('#!/bin/bash\necho "test"');
    
    const response = await request(app)
      .post('/games/non-existent-game-id/upload-executable')
      .set('X-Auth-Token', 'test-token')
      .attach('file', fileContent, 'test-script.sh')
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
      const fileContent = Buffer.from('#!/bin/bash\necho "test"');
      
      const response = await request(app)
        .post(`/games/${gameId}/upload-executable`)
        .attach('file', fileContent, 'test-script.sh')
        .expect(401);
      
      expect(response.body).toHaveProperty('error', 'Unauthorized');
    }
  });

  test('should rename file to script.sh regardless of original name', async () => {
    // First get a game ID from the library
    const libraryResponse = await request(app)
      .get('/libraries/library/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (libraryResponse.body.games.length > 0) {
      const gameId = libraryResponse.body.games[0].id;
      const fileContent = Buffer.from('#!/bin/bash\necho "renamed test"');
      
      const response = await request(app)
        .post(`/games/${gameId}/upload-executable`)
        .set('X-Auth-Token', 'test-token')
        .attach('file', fileContent, 'my-custom-name.sh')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'success');
      
      // Verify the file was saved as script.sh (not my-custom-name.sh)
      const { testMetadataPath } = require('../setup');
      const fs = require('fs');
      const path = require('path');
      const scriptPath = path.join(testMetadataPath, 'content', 'games', String(gameId), 'script.sh');
      const customPath = path.join(testMetadataPath, 'content', 'games', String(gameId), 'my-custom-name.sh');
      
      expect(fs.existsSync(scriptPath)).toBe(true);
      expect(fs.existsSync(customPath)).toBe(false);
    }
  });

  test('should rename file to script.bat regardless of original name', async () => {
    // First get a game ID from the library
    const libraryResponse = await request(app)
      .get('/libraries/library/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (libraryResponse.body.games.length > 0) {
      const gameId = libraryResponse.body.games[0].id;
      const fileContent = Buffer.from('@echo off\necho "renamed test"');
      
      const response = await request(app)
        .post(`/games/${gameId}/upload-executable`)
        .set('X-Auth-Token', 'test-token')
        .attach('file', fileContent, 'my-custom-name.bat')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'success');
      
      // Verify the file was saved as script.bat (not my-custom-name.bat)
      const { testMetadataPath } = require('../setup');
      const fs = require('fs');
      const path = require('path');
      const scriptPath = path.join(testMetadataPath, 'content', 'games', String(gameId), 'script.bat');
      const customPath = path.join(testMetadataPath, 'content', 'games', String(gameId), 'my-custom-name.bat');
      
      expect(fs.existsSync(scriptPath)).toBe(true);
      expect(fs.existsSync(customPath)).toBe(false);
    }
  });

  test('should return updated game data with command field', async () => {
    // First get a game ID from the library
    const libraryResponse = await request(app)
      .get('/libraries/library/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (libraryResponse.body.games.length > 0) {
      const gameId = libraryResponse.body.games[0].id;
      const fileContent = Buffer.from('#!/bin/bash\necho "test"');
      
      const response = await request(app)
        .post(`/games/${gameId}/upload-executable`)
        .set('X-Auth-Token', 'test-token')
        .attach('file', fileContent, 'test-script.sh')
        .expect(200);
      
      const game = response.body.game;
      expect(game).toHaveProperty('id', gameId);
      expect(game).toHaveProperty('title');
      expect(game).toHaveProperty('summary');
      expect(game).toHaveProperty('cover');
      expect(game).toHaveProperty('command', 'sh');
      expect(game).toHaveProperty('day');
      expect(game).toHaveProperty('month');
      expect(game).toHaveProperty('year');
      expect(game).toHaveProperty('stars');
      expect(game).toHaveProperty('genre');
      expect(game).toHaveProperty('criticratings');
      expect(game).toHaveProperty('userratings');
    }
  });

  test('should reject .exe files', async () => {
    // First get a game ID from the library
    const libraryResponse = await request(app)
      .get('/libraries/library/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (libraryResponse.body.games.length > 0) {
      const gameId = libraryResponse.body.games[0].id;
      const fileContent = Buffer.from('fake exe content');
      
      const response = await request(app)
        .post(`/games/${gameId}/upload-executable`)
        .set('X-Auth-Token', 'test-token')
        .attach('file', fileContent, 'test.exe')
        .expect(400);
      
      expect(response.body).toHaveProperty('error', 'Only .sh and .bat files are allowed');
    }
  });
});

describe('DELETE /games/:gameId', () => {
  test('should delete a game successfully', async () => {
    // First get a game ID from the library
    const libraryResponse = await request(app)
      .get('/libraries/library/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (libraryResponse.body.games.length > 0) {
      const gameId = libraryResponse.body.games[0].id;
      
      const response = await request(app)
        .delete(`/games/${gameId}`)
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'success');
      
      // Verify the game was deleted by trying to fetch it
      const getResponse = await request(app)
        .get(`/games/${gameId}`)
        .set('X-Auth-Token', 'test-token')
        .expect(404);
      
      expect(getResponse.body).toHaveProperty('error', 'Game not found');
      
      // Verify the game is no longer in the library list
      const libraryResponseAfter = await request(app)
        .get('/libraries/library/games')
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      const gameStillExists = libraryResponseAfter.body.games.some(g => g.id === gameId);
      expect(gameStillExists).toBe(false);
    }
  });

  test('should delete game content directory', async () => {
    // First get a game ID from the library
    const libraryResponse = await request(app)
      .get('/libraries/library/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (libraryResponse.body.games.length > 0) {
      const gameId = libraryResponse.body.games[0].id;
      const { testMetadataPath } = require('../setup');
      const fs = require('fs');
      const path = require('path');
      
      // Create a test content directory for the game
      const gameContentDir = path.join(testMetadataPath, 'content', 'games', String(gameId));
      if (!fs.existsSync(gameContentDir)) {
        fs.mkdirSync(gameContentDir, { recursive: true });
      }
      
      // Create a test file in the directory
      const testFile = path.join(gameContentDir, 'test.txt');
      fs.writeFileSync(testFile, 'test content');
      
      // Verify the directory exists before deletion
      expect(fs.existsSync(gameContentDir)).toBe(true);
      
      // Delete the game
      const response = await request(app)
        .delete(`/games/${gameId}`)
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'success');
      
      // Verify the directory was deleted
      expect(fs.existsSync(gameContentDir)).toBe(false);
    }
  });

  test('should return 404 for non-existent game', async () => {
    const response = await request(app)
      .delete('/games/non-existent-game-id')
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
        .delete(`/games/${gameId}`)
        .expect(401);
      
      expect(response.body).toHaveProperty('error', 'Unauthorized');
    }
  });

  test('should handle game not found in library file gracefully', async () => {
    // This test verifies that if a game exists in memory but not in the file,
    // the deletion should still work (it will fail when trying to find it in the file)
    // Actually, the current implementation checks allGames first, so if it's not there,
    // it returns 404. Let's test the case where the game is in memory but not in file.
    // Actually, looking at the code, it checks allGames first, so if the game doesn't exist
    // in allGames, it returns 404. So this test is covered by the non-existent game test.
    
    // Test with a completely non-existent game ID
    const response = await request(app)
      .delete('/games/completely-nonexistent-game-id-12345')
      .set('X-Auth-Token', 'test-token')
      .expect(404);
    
    expect(response.body).toHaveProperty('error', 'Game not found');
  });

  test('should remove game from in-memory cache', async () => {
    // First get a game ID from the library
    const libraryResponse = await request(app)
      .get('/libraries/library/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (libraryResponse.body.games.length > 0) {
      const gameId = libraryResponse.body.games[0].id;
      
      // Verify game exists before deletion
      const getResponseBefore = await request(app)
        .get(`/games/${gameId}`)
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      expect(getResponseBefore.body).toHaveProperty('id', gameId);
      
      // Delete the game
      const deleteResponse = await request(app)
        .delete(`/games/${gameId}`)
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      expect(deleteResponse.body).toHaveProperty('status', 'success');
      
      // Verify game is removed from cache (should return 404)
      const getResponseAfter = await request(app)
        .get(`/games/${gameId}`)
        .set('X-Auth-Token', 'test-token')
        .expect(404);
      
      expect(getResponseAfter.body).toHaveProperty('error', 'Game not found');
    }
  });

  test('should delete orphaned categories when deleting a game', async () => {
    // Create a category
    const createCategoryResponse = await request(app)
      .post('/categories')
      .set('X-Auth-Token', 'test-token')
      .send({ title: 'orphanedcategory' })
      .expect(200);
    
    const categoryId = createCategoryResponse.body.category.id;
    
    // Verify category exists
    const categoriesBefore = await request(app)
      .get('/categories')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    const categoryExistsBefore = categoriesBefore.body.categories.some(c => c.id === categoryId);
    expect(categoryExistsBefore).toBe(true);
    
    // Add a game with this category
    const addGameResponse = await request(app)
      .post('/games/add-from-igdb')
      .set('X-Auth-Token', 'test-token')
      .send({
        igdbId: 999994,
        name: 'Test Game with Orphaned Category',
        summary: 'Test summary',
        releaseDate: 1609459200,
        genres: ['orphanedcategory'],
        criticRating: 80,
        userRating: 75
      })
      .expect(200);
    
    const gameId = addGameResponse.body.gameId;
    
    // Verify game has the category
    const gameResponse = await request(app)
      .get(`/games/${gameId}`)
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    expect(gameResponse.body.genre).toContain('orphanedcategory');
    
    // Delete the game
    const deleteResponse = await request(app)
      .delete(`/games/${gameId}`)
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    expect(deleteResponse.body).toHaveProperty('status', 'success');
    
    // Verify category was deleted (orphaned)
    const categoriesAfter = await request(app)
      .get('/categories')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    const categoryExistsAfter = categoriesAfter.body.categories.some(c => c.id === categoryId);
    expect(categoryExistsAfter).toBe(false);
  });

  test('should not delete categories that are still used by other games', async () => {
    // Create a category
    const createCategoryResponse = await request(app)
      .post('/categories')
      .set('X-Auth-Token', 'test-token')
      .send({ title: 'sharedcategory' })
      .expect(200);
    
    const categoryId = createCategoryResponse.body.category.id;
    
    // Add first game with this category
    const addGame1Response = await request(app)
      .post('/games/add-from-igdb')
      .set('X-Auth-Token', 'test-token')
      .send({
        igdbId: 999993,
        name: 'Test Game 1 with Shared Category',
        summary: 'Test summary',
        releaseDate: 1609459200,
        genres: ['sharedcategory'],
        criticRating: 80,
        userRating: 75
      })
      .expect(200);
    
    const gameId1 = addGame1Response.body.gameId;
    
    // Add second game with the same category
    const addGame2Response = await request(app)
      .post('/games/add-from-igdb')
      .set('X-Auth-Token', 'test-token')
      .send({
        igdbId: 999992,
        name: 'Test Game 2 with Shared Category',
        summary: 'Test summary',
        releaseDate: 1609459200,
        genres: ['sharedcategory'],
        criticRating: 85,
        userRating: 80
      })
      .expect(200);
    
    const gameId2 = addGame2Response.body.gameId;
    
    // Delete first game
    const deleteResponse = await request(app)
      .delete(`/games/${gameId1}`)
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    expect(deleteResponse.body).toHaveProperty('status', 'success');
    
    // Verify category still exists (used by second game)
    const categoriesAfter = await request(app)
      .get('/categories')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    const categoryExistsAfter = categoriesAfter.body.categories.some(c => c.id === categoryId);
    expect(categoryExistsAfter).toBe(true);
    
    // Cleanup: delete second game
    await request(app)
      .delete(`/games/${gameId2}`)
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    // Now category should be deleted (orphaned)
    const categoriesFinal = await request(app)
      .get('/categories')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    const categoryExistsFinal = categoriesFinal.body.categories.some(c => c.id === categoryId);
    expect(categoryExistsFinal).toBe(false);
  });
});

describe('POST /games/add-from-igdb', () => {
  test('should add game from IGDB and create missing categories', async () => {
    // Get initial categories count
    const categoriesBefore = await request(app)
      .get('/categories')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    const initialCategoriesCount = categoriesBefore.body.categories.length;
    
    // Add a game with new genres
    const response = await request(app)
      .post('/games/add-from-igdb')
      .set('X-Auth-Token', 'test-token')
      .send({
        igdbId: 999999,
        name: 'Test Game from IGDB',
        summary: 'Test summary',
        cover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/test.jpg',
        background: 'https://images.igdb.com/igdb/image/upload/t_1080p/test.jpg',
        releaseDate: 1609459200, // 2021-01-01 timestamp
        genres: ['New Genre 1', 'New Genre 2'],
        criticRating: 85,
        userRating: 80
      })
      .expect(200);
    
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body).toHaveProperty('game');
    expect(response.body).toHaveProperty('gameId', 999999);
    expect(response.body.game).toHaveProperty('id', 999999);
    expect(response.body.game).toHaveProperty('title', 'Test Game from IGDB');
    expect(response.body.game).toHaveProperty('genre');
    expect(Array.isArray(response.body.game.genre)).toBe(true);
    // Genres should be normalized to lowercase
    expect(response.body.game.genre).toContain('new genre 1');
    expect(response.body.game.genre).toContain('new genre 2');
    
    // Verify categories were created
    const categoriesAfter = await request(app)
      .get('/categories')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    expect(categoriesAfter.body.categories.length).toBe(initialCategoriesCount + 2);
    
    const newGenre1 = categoriesAfter.body.categories.find(c => c.title === 'new genre 1');
    const newGenre2 = categoriesAfter.body.categories.find(c => c.title === 'new genre 2');
    
    expect(newGenre1).toBeDefined();
    expect(newGenre2).toBeDefined();
    expect(newGenre1.id).toBe('genre_new_genre_1');
    expect(newGenre2.id).toBe('genre_new_genre_2');
    
    // Cleanup: delete the test game
    await request(app)
      .delete(`/games/${999999}`)
      .set('X-Auth-Token', 'test-token')
      .expect(200);
  });

  test('should not create duplicate categories if they already exist', async () => {
    // First create a category manually
    const createCategoryResponse = await request(app)
      .post('/categories')
      .set('X-Auth-Token', 'test-token')
      .send({ title: 'Existing Genre' })
      .expect(200);
    
    const existingCategoryId = createCategoryResponse.body.category.id;
    
    // Get categories count before adding game
    const categoriesBefore = await request(app)
      .get('/categories')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    const initialCategoriesCount = categoriesBefore.body.categories.length;
    
    // Add a game with the same genre
    const response = await request(app)
      .post('/games/add-from-igdb')
      .set('X-Auth-Token', 'test-token')
      .send({
        igdbId: 999998,
        name: 'Test Game with Existing Genre',
        summary: 'Test summary',
        releaseDate: 1609459200,
        genres: ['Existing Genre'],
        criticRating: 75,
        userRating: 70
      })
      .expect(200);
    
    expect(response.body).toHaveProperty('status', 'success');
    
    // Verify genre was normalized to lowercase
    expect(response.body.game).toHaveProperty('genre');
    expect(Array.isArray(response.body.game.genre)).toBe(true);
    expect(response.body.game.genre).toContain('existing genre');
    
    // Verify category count didn't increase
    const categoriesAfter = await request(app)
      .get('/categories')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    expect(categoriesAfter.body.categories.length).toBe(initialCategoriesCount);
    
    // Verify the existing category still exists
    const existingCategory = categoriesAfter.body.categories.find(c => c.id === existingCategoryId);
    expect(existingCategory).toBeDefined();
    
    // Cleanup: delete the test game
    await request(app)
      .delete(`/games/${999998}`)
      .set('X-Auth-Token', 'test-token')
      .expect(200);
  });

  test('should return 400 if required fields are missing', async () => {
    const response = await request(app)
      .post('/games/add-from-igdb')
      .set('X-Auth-Token', 'test-token')
      .send({
        name: 'Test Game'
        // Missing igdbId
      })
      .expect(400);
    
    expect(response.body).toHaveProperty('error', 'Missing required fields: igdbId and name');
  });

  test('should return 409 if game already exists', async () => {
    // First get an existing game ID
    const libraryResponse = await request(app)
      .get('/libraries/library/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (libraryResponse.body.games.length > 0) {
      const existingGameId = libraryResponse.body.games[0].id;
      
      // Try to add the same game again
      const response = await request(app)
        .post('/games/add-from-igdb')
        .set('X-Auth-Token', 'test-token')
        .send({
          igdbId: existingGameId,
          name: 'Duplicate Game',
          summary: 'Test summary'
        })
        .expect(409);
      
      expect(response.body).toHaveProperty('error', 'Game already exists');
      expect(response.body).toHaveProperty('gameId', existingGameId);
    }
  });

  test('should handle games without genres', async () => {
    const response = await request(app)
      .post('/games/add-from-igdb')
      .set('X-Auth-Token', 'test-token')
      .send({
        igdbId: 999997,
        name: 'Test Game Without Genres',
        summary: 'Test summary',
        releaseDate: 1609459200
      })
      .expect(200);
    
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body.game).toHaveProperty('genre');
    expect(response.body.game.genre).toBeNull();
    
    // Cleanup: delete the test game
    await request(app)
      .delete(`/games/${999997}`)
      .set('X-Auth-Token', 'test-token')
      .expect(200);
  });

  test('should require authentication', async () => {
    const response = await request(app)
      .post('/games/add-from-igdb')
      .send({
        igdbId: 999996,
        name: 'Test Game'
      })
      .expect(401);
    
    expect(response.body).toHaveProperty('error', 'Unauthorized');
  });

  test('should normalize genres to lowercase', async () => {
    // Add a game with uppercase genres
    const response = await request(app)
      .post('/games/add-from-igdb')
      .set('X-Auth-Token', 'test-token')
      .send({
        igdbId: 999995,
        name: 'Test Game with Uppercase Genres',
        summary: 'Test summary',
        releaseDate: 1609459200,
        genres: ['ACTION', 'ADVENTURE', 'RPG'],
        criticRating: 90,
        userRating: 85
      })
      .expect(200);
    
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body.game).toHaveProperty('genre');
    expect(Array.isArray(response.body.game.genre)).toBe(true);
    
    // Verify genres are normalized to lowercase
    expect(response.body.game.genre).toContain('action');
    expect(response.body.game.genre).toContain('adventure');
    expect(response.body.game.genre).toContain('rpg');
    
    // Verify no uppercase genres exist
    expect(response.body.game.genre).not.toContain('ACTION');
    expect(response.body.game.genre).not.toContain('ADVENTURE');
    expect(response.body.game.genre).not.toContain('RPG');
    
    // Verify categories were created with lowercase titles
    const categoriesResponse = await request(app)
      .get('/categories')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    const actionCategory = categoriesResponse.body.categories.find(c => c.title === 'action');
    const adventureCategory = categoriesResponse.body.categories.find(c => c.title === 'adventure');
    const rpgCategory = categoriesResponse.body.categories.find(c => c.title === 'rpg');
    
    expect(actionCategory).toBeDefined();
    expect(adventureCategory).toBeDefined();
    expect(rpgCategory).toBeDefined();
    
    // Cleanup: delete the test game
    await request(app)
      .delete(`/games/${999995}`)
      .set('X-Auth-Token', 'test-token')
      .expect(200);
  });
});

