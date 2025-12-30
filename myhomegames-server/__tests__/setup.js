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
  fs.mkdirSync(path.join(testMetadataPath, 'content'), { recursive: true });
  
  // Copy test fixtures to test metadata directory
  const fixturesDir = path.join(__dirname, 'fixtures');
  const libraries = ['recommended', 'library', 'categories'];
  
  libraries.forEach((libName) => {
    const sourceFile = path.join(fixturesDir, `games-${libName}.json`);
    const destFile = path.join(testMetadataPath, 'metadata', `games-${libName}.json`);
    if (fs.existsSync(sourceFile)) {
      fs.copyFileSync(sourceFile, destFile);
    }
  });
  
  // Copy collections file
  const collectionsSource = path.join(fixturesDir, 'games-collections.json');
  const collectionsDest = path.join(testMetadataPath, 'metadata', 'games-collections.json');
  if (fs.existsSync(collectionsSource)) {
    fs.copyFileSync(collectionsSource, collectionsDest);
  }
  
  // Create collections content directory
  const collectionsContentDir = path.join(testMetadataPath, 'content', 'collections');
  fs.mkdirSync(collectionsContentDir, { recursive: true });
  
  // Copy settings.json
  const settingsSource = path.join(fixturesDir, 'settings.json');
  const settingsDest = path.join(testMetadataPath, 'settings.json');
  if (fs.existsSync(settingsSource)) {
    fs.copyFileSync(settingsSource, settingsDest);
  }
  
  // Create test cover image directories in content/games folder
  const testGameId = 'test_game_1';
  const gamesContentDir = path.join(testMetadataPath, 'content', 'games');
  fs.mkdirSync(gamesContentDir, { recursive: true });
  const coverDir = path.join(gamesContentDir, testGameId);
  fs.mkdirSync(coverDir, { recursive: true });
  // Create a dummy cover file (empty file for testing)
  fs.writeFileSync(path.join(coverDir, 'cover.webp'), 'fake webp data');
  
  // Create test category cover directory in content/categories folder
  const categoriesContentDir = path.join(testMetadataPath, 'content', 'categories');
  fs.mkdirSync(categoriesContentDir, { recursive: true });
  
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

