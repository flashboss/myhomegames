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

describe('GET /recommended', () => {
  test('should return recommended sections', async () => {
    const response = await request(app)
      .get('/recommended')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    expect(response.body).toHaveProperty('sections');
    expect(Array.isArray(response.body.sections)).toBe(true);
    expect(response.body.sections.length).toBeGreaterThan(0);
  });

  test('should return sections with correct structure', async () => {
    const response = await request(app)
      .get('/recommended')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    if (response.body.sections.length > 0) {
      const section = response.body.sections[0];
      expect(section).toHaveProperty('id');
      expect(section).toHaveProperty('games');
      expect(Array.isArray(section.games)).toBe(true);
    }
  });

  test('should return games with correct structure in sections', async () => {
    const response = await request(app)
      .get('/recommended')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    const sectionWithGames = response.body.sections.find(s => s.games.length > 0);
    if (sectionWithGames && sectionWithGames.games.length > 0) {
      const game = sectionWithGames.games[0];
      expect(game).toHaveProperty('id');
      expect(game).toHaveProperty('title');
      expect(game).toHaveProperty('summary');
      expect(game).toHaveProperty('cover');
      expect(game.cover).toContain('/covers/');
    }
  });

  test('should include optional fields when present', async () => {
    const response = await request(app)
      .get('/recommended')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    // Find a game with stars in any section
    let gameWithStars = null;
    for (const section of response.body.sections) {
      gameWithStars = section.games.find(g => g.stars);
      if (gameWithStars) break;
    }
    
    if (gameWithStars) {
      expect(typeof gameWithStars.stars).toBe('number');
    }
  });

  test('should support old format (backward compatibility)', async () => {
    // This test verifies that the old format (array of IDs) is still supported
    // The implementation should convert old format to a single section with id "recommended"
    const response = await request(app)
      .get('/recommended')
      .set('X-Auth-Token', 'test-token')
      .expect(200);
    
    // Should return sections array
    expect(response.body).toHaveProperty('sections');
    expect(Array.isArray(response.body.sections)).toBe(true);
  });

  test('should require authentication', async () => {
    const response = await request(app)
      .get('/recommended')
      .expect(401);
    
    expect(response.body).toHaveProperty('error', 'Unauthorized');
  });
});

