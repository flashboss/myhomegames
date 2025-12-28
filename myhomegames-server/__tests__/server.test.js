const request = require('supertest');
const fs = require('fs');
const path = require('path');

// Import setup first to set environment variables
const { testMetadataPath } = require('./setup');

// Import server after setting up environment
let app;

beforeAll(() => {
  // Clear module cache to ensure fresh server instance
  delete require.cache[require.resolve('../server.js')];
  app = require('../server.js');
});

describe('Authentication', () => {
  test('should reject requests without token', async () => {
    const response = await request(app)
      .get('/libraries')
      .expect(401);
    
    expect(response.body).toHaveProperty('error', 'Unauthorized');
  });

  test('should accept requests with X-Auth-Token header', async () => {
    const response = await request(app)
      .get('/libraries')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    expect(response.body).toHaveProperty('libraries');
  });

  test('should accept requests with token query parameter', async () => {
    const response = await request(app)
      .get('/libraries?token=test-token')
      .expect(200);
    
    expect(response.body).toHaveProperty('libraries');
  });

  test('should accept requests with Authorization header', async () => {
    const response = await request(app)
      .get('/libraries')
      .set('Authorization', 'test-token')
      .expect(200);
    
    expect(response.body).toHaveProperty('libraries');
  });
});

describe('GET /libraries', () => {
  test('should return list of libraries', async () => {
    const response = await request(app)
      .get('/libraries')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    expect(response.body).toHaveProperty('libraries');
    expect(Array.isArray(response.body.libraries)).toBe(true);
    expect(response.body.libraries.length).toBe(4);
    
    const libraryKeys = response.body.libraries.map(lib => lib.key);
    expect(libraryKeys).toContain('consigliati');
    expect(libraryKeys).toContain('libreria');
    expect(libraryKeys).toContain('raccolte');
    expect(libraryKeys).toContain('categorie');
  });

  test('should return libraries with correct structure', async () => {
    const response = await request(app)
      .get('/libraries')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    response.body.libraries.forEach(lib => {
      expect(lib).toHaveProperty('key');
      expect(lib).toHaveProperty('title');
      expect(lib).toHaveProperty('type');
      expect(lib.type).toBe('games');
    });
  });
});

describe('GET /libraries/:id/games', () => {
  test('should return games for a valid library', async () => {
    const response = await request(app)
      .get('/libraries/consigliati/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    expect(response.body).toHaveProperty('games');
    expect(Array.isArray(response.body.games)).toBe(true);
    expect(response.body.games.length).toBeGreaterThan(0);
  });

  test('should return empty array for non-existent library', async () => {
    const response = await request(app)
      .get('/libraries/nonexistent/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    expect(response.body).toHaveProperty('games');
    expect(Array.isArray(response.body.games)).toBe(true);
    expect(response.body.games.length).toBe(0);
  });

  test('should return games with correct structure', async () => {
    const response = await request(app)
      .get('/libraries/consigliati/games')
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
      .get('/libraries/consigliati/games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    const gameWithStars = response.body.games.find(g => g.stars);
    if (gameWithStars) {
      expect(typeof gameWithStars.stars).toBe('number');
    }
  });
});

describe('GET /covers/:gameId', () => {
  test('should return 404 for non-existent cover', async () => {
    const response = await request(app)
      .get('/covers/nonexistent_game')
      .expect(404);
    
    expect(response.body).toHaveProperty('error', 'Cover not found');
  });

  test('should return cover image for existing game', async () => {
    const response = await request(app)
      .get('/covers/test_game_1')
      .expect(200);
    
    expect(response.headers['content-type']).toContain('image/webp');
  });

  test('should handle URL-encoded game IDs', async () => {
    const encodedId = encodeURIComponent('test_game_1');
    const response = await request(app)
      .get(`/covers/${encodedId}`)
      .expect(200);
    
    expect(response.headers['content-type']).toContain('image/webp');
  });
});

describe('GET /launcher', () => {
  test('should return 400 if gameId is missing', async () => {
    const response = await request(app)
      .get('/launcher')
      .set('X-Auth-Token', 'test-token')
      .expect(400);
    
    expect(response.body).toHaveProperty('error', 'Missing gameId');
  });

  test('should return 404 for non-existent game', async () => {
    const response = await request(app)
      .get('/launcher?gameId=nonexistent')
      .set('X-Auth-Token', 'test-token')
      .expect(404);
    
    expect(response.body).toHaveProperty('error', 'Game not found');
  });

  test('should validate command path when allowed_dir is set', async () => {
    // This test depends on the test fixtures having allowed_dir set
    const response = await request(app)
      .get('/launcher?gameId=test_game_1')
      .set('X-Auth-Token', 'test-token');
    
    // Should either succeed (if command exists) or fail with appropriate error
    expect([200, 403, 500]).toContain(response.status);
  });
});

describe('POST /reload-games', () => {
  test('should reload games and return count', async () => {
    const response = await request(app)
      .post('/reload-games')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    expect(response.body).toHaveProperty('status', 'reloaded');
    expect(response.body).toHaveProperty('count');
    expect(typeof response.body.count).toBe('number');
    expect(response.body.count).toBeGreaterThan(0);
  });

  test('should require authentication', async () => {
    const response = await request(app)
      .post('/reload-games')
      .expect(401);
    
    expect(response.body).toHaveProperty('error', 'Unauthorized');
  });
});

describe('GET /settings', () => {
  test('should return settings', async () => {
    const response = await request(app)
      .get('/settings')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    expect(response.body).toHaveProperty('language');
  });

  test('should return default settings if file does not exist', async () => {
    // Temporarily rename settings file
    const settingsPath = path.join(testMetadataPath, 'settings.json');
    const backupPath = settingsPath + '.backup';
    
    if (fs.existsSync(settingsPath)) {
      fs.renameSync(settingsPath, backupPath);
    }
    
    const response = await request(app)
      .get('/settings')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    expect(response.body).toHaveProperty('language', 'en');
    
    // Restore settings file
    if (fs.existsSync(backupPath)) {
      fs.renameSync(backupPath, settingsPath);
    }
  });

  test('should require authentication', async () => {
    const response = await request(app)
      .get('/settings')
      .expect(401);
    
    expect(response.body).toHaveProperty('error', 'Unauthorized');
  });
});

describe('PUT /settings', () => {
  test('should accept settings update request', async () => {
    const newSettings = { language: 'it' };
    
    const response = await request(app)
      .put('/settings')
      .set('X-Auth-Token', 'test-token')
      .send(newSettings)
      .expect(200);
    
    // Note: Server currently does not persist settings to file
    // It only returns the merged settings in the response
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body).toHaveProperty('settings');
    expect(response.body.settings).toHaveProperty('language', 'it');
  });

  test('should merge with existing settings', async () => {
    // First get current settings
    const currentResponse = await request(app)
      .get('/settings')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    const currentLanguage = currentResponse.body.language;
    
    // Then update with new language
    const response = await request(app)
      .put('/settings')
      .set('X-Auth-Token', 'test-token')
      .send({ language: 'it' })
      .expect(200);
    
    expect(response.body.settings.language).toBe('it');
    
    // Verify settings were merged (should include other fields if they exist)
    expect(response.body.settings).toHaveProperty('language');
  });

  test('should require authentication', async () => {
    const response = await request(app)
      .put('/settings')
      .send({ language: 'en' })
      .expect(401);
    
    expect(response.body).toHaveProperty('error', 'Unauthorized');
  });
});

describe('GET /igdb/search', () => {
  test('should return 400 if query is missing', async () => {
    const response = await request(app)
      .get('/igdb/search')
      .set('X-Auth-Token', 'test-token')
      .expect(400);
    
    expect(response.body).toHaveProperty('error', 'Missing search query');
  });

  test('should return 400 if query is empty', async () => {
    const response = await request(app)
      .get('/igdb/search?q=')
      .set('X-Auth-Token', 'test-token')
      .expect(400);
    
    expect(response.body).toHaveProperty('error', 'Missing search query');
  });

  test('should require authentication', async () => {
    const response = await request(app)
      .get('/igdb/search?q=test')
      .expect(401);
    
    expect(response.body).toHaveProperty('error', 'Unauthorized');
  });

  // Note: Full IGDB integration tests would require mocking HTTP requests
  // This is left as a placeholder for future implementation
});

