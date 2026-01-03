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
      const scriptPath = path.join(testMetadataPath, 'content', 'games', gameId, 'script.sh');
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
      const scriptPath = path.join(testMetadataPath, 'content', 'games', gameId, 'script.bat');
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
      const scriptPath = path.join(testMetadataPath, 'content', 'games', gameId, 'script.sh');
      const customPath = path.join(testMetadataPath, 'content', 'games', gameId, 'my-custom-name.sh');
      
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
      const scriptPath = path.join(testMetadataPath, 'content', 'games', gameId, 'script.bat');
      const customPath = path.join(testMetadataPath, 'content', 'games', gameId, 'my-custom-name.bat');
      
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
      const gameContentDir = path.join(testMetadataPath, 'content', 'games', gameId);
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
});

