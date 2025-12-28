const fs = require('fs');
const path = require('path');
const os = require('os');

// Create a temporary directory for test metadata
const testMetadataPath = path.join(os.tmpdir(), `myhomegames-test-${Date.now()}`);

// Set environment variables before requiring server
process.env.NODE_ENV = 'test';
process.env.METADATA_PATH = testMetadataPath;
process.env.API_TOKEN = 'test-token';
process.env.PORT = '0'; // Use random port for tests

// Setup test environment
beforeAll(() => {
  // Create test metadata directory structure
  fs.mkdirSync(testMetadataPath, { recursive: true });
  fs.mkdirSync(path.join(testMetadataPath, 'metadata'), { recursive: true });
  
  // Copy test fixtures to test metadata directory
  const fixturesDir = path.join(__dirname, 'fixtures');
  const libraries = ['consigliati', 'libreria', 'raccolte', 'categorie'];
  
  libraries.forEach(lib => {
    const sourceFile = path.join(fixturesDir, `games-${lib}.json`);
    const destFile = path.join(testMetadataPath, 'metadata', `games-${lib}.json`);
    if (fs.existsSync(sourceFile)) {
      fs.copyFileSync(sourceFile, destFile);
    }
  });
  
  // Copy settings.json
  const settingsSource = path.join(fixturesDir, 'settings.json');
  const settingsDest = path.join(testMetadataPath, 'settings.json');
  if (fs.existsSync(settingsSource)) {
    fs.copyFileSync(settingsSource, settingsDest);
  }
  
  // Create a test cover image directory
  const testGameId = 'test_game_1';
  const coverDir = path.join(testMetadataPath, testGameId);
  fs.mkdirSync(coverDir, { recursive: true });
  // Create a dummy cover file (empty file for testing)
  fs.writeFileSync(path.join(coverDir, 'cover.webp'), 'fake webp data');
  
  // Set environment variable for test metadata path
  process.env.METADATA_PATH = testMetadataPath;
  process.env.API_TOKEN = 'test-token';
  process.env.PORT = '0'; // Use random port for tests
});

// Cleanup after all tests
afterAll(() => {
  // Remove test metadata directory
  if (fs.existsSync(testMetadataPath)) {
    fs.rmSync(testMetadataPath, { recursive: true, force: true });
  }
});

module.exports = { testMetadataPath };

