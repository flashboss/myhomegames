const request = require('supertest');
const fs = require('fs');
const path = require('path');

// Import setup first to set environment variables
const { testMetadataPath } = require('./setup');

describe('Helper Functions', () => {
  let app;
  
  beforeAll(() => {
    // Clear module cache to ensure fresh server instance
    delete require.cache[require.resolve('../server.js')];
    app = require('../server.js');
  });

  describe('Game Loading', () => {
    test('should load library games from JSON file', async () => {
      const response = await request(app)
            .get('/libraries/library/games')
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      expect(response.body.games.length).toBeGreaterThan(0);
    });

    test('should load recommended games from JSON file', async () => {
      const response = await request(app)
        .get('/recommended')
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      expect(response.body.games.length).toBeGreaterThan(0);
    });

    test('should reload games correctly', async () => {
      const beforeReload = await request(app)
        .get('/recommended')
        .set('X-Auth-Token', 'test-token');
      
      await request(app)
        .post('/reload-games')
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      const afterReload = await request(app)
        .get('/recommended')
        .set('X-Auth-Token', 'test-token');
      
      expect(afterReload.body.games.length).toBe(beforeReload.body.games.length);
    });
  });

  describe('Settings Management', () => {
    test('should read settings from file', async () => {
      const response = await request(app)
        .get('/settings')
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      expect(response.body).toHaveProperty('language');
    });

    test('should return default settings when file does not exist', async () => {
      const settingsPath = path.join(testMetadataPath, 'settings.json');
      const backupPath = settingsPath + '.backup';
      
      // Backup and remove settings file
      if (fs.existsSync(settingsPath)) {
        fs.renameSync(settingsPath, backupPath);
      }
      
      // Clear cache to force reload
      delete require.cache[require.resolve('../server.js')];
      const freshApp = require('../server.js');
      
      const response = await request(freshApp)
        .get('/settings')
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      expect(response.body.language).toBe('en');
      
      // Restore settings file
      if (fs.existsSync(backupPath)) {
        fs.renameSync(backupPath, settingsPath);
      }
    });

    test('should handle invalid JSON in settings file', async () => {
      const settingsPath = path.join(testMetadataPath, 'settings.json');
      const backupPath = settingsPath + '.backup';
      
      // Backup original
      if (fs.existsSync(settingsPath)) {
        fs.copyFileSync(settingsPath, backupPath);
      }
      
      // Write invalid JSON
      fs.writeFileSync(settingsPath, '{ invalid json }');
      
      // Clear cache to force reload
      delete require.cache[require.resolve('../server.js')];
      const freshApp = require('../server.js');
      
      // Should return default settings
      const response = await request(freshApp)
        .get('/settings')
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      expect(response.body.language).toBe('en');
      
      // Restore original
      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, settingsPath);
        fs.unlinkSync(backupPath);
      }
    });
  });

  describe('Game Data Structure', () => {
    test('should include all required fields in game response', async () => {
      const response = await request(app)
        .get('/recommended')
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      if (response.body.games.length > 0) {
        const game = response.body.games[0];
        expect(game).toHaveProperty('id');
        expect(game).toHaveProperty('title');
        expect(game).toHaveProperty('summary');
        expect(game).toHaveProperty('cover');
      }
    });

    test('should handle optional fields correctly', async () => {
      const response = await request(app)
        .get('/recommended')
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      response.body.games.forEach(game => {
        // Optional fields should be null if not present
        if (game.year === null || game.year === undefined) {
          // That's fine, year is optional
        } else {
          expect(typeof game.year).toBe('number');
        }
        
        if (game.stars === null || game.stars === undefined) {
          // That's fine, stars is optional
        } else {
          expect(typeof game.stars).toBe('number');
        }
      });
    });

    test('should format cover URL correctly', async () => {
      const response = await request(app)
        .get('/recommended')
        .set('X-Auth-Token', 'test-token')
        .expect(200);
      
      if (response.body.games.length > 0) {
        const game = response.body.games[0];
        expect(game.cover).toMatch(/^\/covers\//);
        expect(game.cover).toContain(game.id);
      }
    });
  });
});

