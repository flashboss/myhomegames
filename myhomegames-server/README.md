# MyHomeGames Server

Express.js server for the MyHomeGames application.

## Installation

```bash
npm install
```

## Configuration

The server can be configured using environment variables. Create a `.env` file in the `myhomegames-server` directory or set environment variables before starting the server.

### Environment Variables

- `PORT` (default: `4000`) - Port on which the server will listen
- `API_TOKEN` (default: `changeme`) - Authentication token for API requests
- `IGDB_CLIENT_ID` - IGDB API client ID for game search functionality
- `IGDB_CLIENT_SECRET` - IGDB API client secret for game search functionality
- `METADATA_PATH` - Path where game metadata (covers, descriptions, etc.) are stored

### Metadata Path

The `METADATA_PATH` environment variable specifies the directory where all persistent data files are stored. This includes game metadata, cover images, settings, and game library data.

**Default value**: `$HOME/Library/Application Support/MyHomeGames`

**Example configuration in `.env` file**:
```
METADATA_PATH=/path/to/your/metadata
```

If `METADATA_PATH` is not set, the server will use the default path based on the user's home directory.

#### Directory Structure

The server expects the following directory structure under `METADATA_PATH`:

```
${METADATA_PATH}/
├── settings.json                    # Application settings (language, etc.)
├── metadata/                        # Game library data files
│   ├── games-consigliati.json      # Recommended games library
│   ├── games-libreria.json         # Main library
│   ├── games-raccolte.json         # Collections library
│   └── games-categorie.json        # Categories library
└── content/                         # Game content (covers, etc.)
    └── ${gameId}/                   # Per-game content directories
        └── cover.webp               # Game cover image
```

#### Persistent Data Files

All JSON files and settings are stored outside the codebase in the metadata path. These files are not part of the repository and should be managed separately:

- **`settings.json`**: Application settings (language preference, etc.)
- **`metadata/games-*.json`**: Game data files for each library. Each file contains an array of game objects with properties like `id`, `title`, `summary`, `year`, `stars`, etc.

#### Initial Setup

On first run, you may need to create the metadata directory structure:

```bash
mkdir -p "${METADATA_PATH}/metadata"
mkdir -p "${METADATA_PATH}/content"
```

Then create the required JSON files or copy them from a backup. The server will create default settings if `settings.json` doesn't exist.

**Note**: If you're migrating from an older version, you'll need to move existing game cover directories from `${METADATA_PATH}/${gameId}/` to `${METADATA_PATH}/content/${gameId}/`.

## Running the Server

### Development Mode

```bash
npm run dev
```

This uses `nodemon` to automatically restart the server when files change.

### Production Mode

```bash
npm start
```

## Testing

The server includes a comprehensive test suite using Jest and Supertest to ensure all functionality works correctly.

**Note**: Test files and dependencies are excluded from production deployments:
- Test files (`__tests__/`) are not included when publishing to npm (via `.npmignore`)
- Test dependencies (`jest`, `supertest`) are in `devDependencies` and won't be installed with `npm install --production`
- Tests are only needed during development and CI/CD pipelines

### Prerequisites

Before running tests, make sure all dependencies are installed:

```bash
npm install
```

### Running Tests

To run all tests once:

```bash
npm test
```

This will execute all test suites and display a summary of passed/failed tests.

### Running Tests in Watch Mode

To run tests in watch mode (automatically re-runs tests when files change):

```bash
npm run test:watch
```

This is useful during development as it provides immediate feedback when making changes.

### Test Coverage

The test suite covers:
- **Authentication**: Token validation via headers, query parameters, and Authorization header
- **API Endpoints**: All GET, POST, and PUT endpoints
  - `/libraries` - Library listing
  - `/libraries/:id/games` - Game listing by library
  - `/covers/:gameId` - Cover image serving
  - `/launcher` - Game launching
  - `/reload-games` - Game reloading
  - `/settings` - Settings management
  - `/igdb/search` - IGDB game search
- **Helper Functions**: Game loading, settings reading, data structure validation

### Test Structure

Tests are organized in the `__tests__` directory:

```
__tests__/
├── setup.js              # Test environment setup and teardown
├── server.test.js        # API endpoint tests
├── helpers.test.js       # Helper function tests
└── fixtures/             # Test data files
    ├── games-consigliati.json
    ├── games-libreria.json
    ├── games-raccolte.json
    ├── games-categorie.json
    └── settings.json
```

### Test Environment

The test suite uses a temporary metadata directory created in the system temp folder. This ensures:
- Tests don't interfere with production data
- Each test run starts with a clean state
- Tests are isolated and can run independently
- No cleanup required after tests complete

### Writing New Tests

When adding new functionality:
1. Add test cases to the appropriate test file (`server.test.js` for endpoints, `helpers.test.js` for utilities)
2. Add test fixtures if needed in `__tests__/fixtures/`
3. Ensure tests are isolated and don't depend on external services (mock when necessary)
4. Run `npm test` to verify all tests pass

## API Endpoints

- `GET /libraries` - Get list of game libraries (requires authentication)
- `GET /games/:library` - Get games for a specific library (requires authentication)
- `POST /launch/:gameId` - Launch a game (requires authentication)
- `GET /search` - Search games via IGDB API (requires authentication)
- `GET /covers/:gameId` - Get game cover image (public, no authentication required)

All authenticated endpoints require the `X-Auth-Token` header with a valid token.

## Authentication

API requests must include the `X-Auth-Token` header with the value set in the `API_TOKEN` environment variable.

Example:
```bash
curl -H "X-Auth-Token: your-token-here" http://localhost:4000/libraries
```

