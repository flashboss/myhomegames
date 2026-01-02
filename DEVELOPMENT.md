# Development Setup Guide

This guide covers the development environment setup for MyHomeGames.

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

## Quick Start

### Server Setup

1. Navigate to the `myhomegames-server` directory:
   ```bash
   cd myhomegames-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

4. The `.env` file contains `API_TOKEN=changeme` for development authentication.

5. Start the development server:
   ```bash
   npm run dev
   ```

   This uses `nodemon` to automatically restart the server when files change.

The server will be available at `http://127.0.0.1:4000` (or the port specified in `.env`).

### Web Application Setup

1. Navigate to the `myhomegames-web` directory:
   ```bash
   cd myhomegames-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. The `.env` file is committed to the repository:
   - On the `0-X-SNAPSHOT` branch: contains development configuration (`VITE_API_TOKEN=changeme`, `VITE_API_BASE=http://127.0.0.1:4000`)
   - On the `main` branch: contains production configuration

4. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173` (or the port shown in the terminal).

## Development Configuration

### Server Environment Variables

For development, the server uses the following environment variables:

- `PORT` (default: `4000`) - Port on which the server will listen
- `API_TOKEN` - Authentication token for API requests (development only, optional)
  - Default: `changeme` (from `.env.example`)
  - Used for quick testing without setting up Twitch OAuth
- `API_BASE` - Base URL of the API server (optional for development)
- `METADATA_PATH` - Path where game metadata are stored
  - Default: `$HOME/Library/Application Support/MyHomeGames`

### Web Application Environment Variables

For development, the web application uses:

- `VITE_API_BASE` - Base URL of the API server
  - Development: `http://127.0.0.1:4000`
- `VITE_API_TOKEN` - Authentication token for development (optional)
  - Development: `changeme`
  - Only used when Twitch OAuth is not configured

**Note**: `VITE_API_BASE` is required. The application will not start without it.

## Development Authentication

In development mode, you can use the `API_TOKEN` environment variable for quick testing without setting up Twitch OAuth.

### Server Side

Set `API_TOKEN` in your `.env` file:
```bash
API_TOKEN=changeme
API_BASE=http://127.0.0.1:4000
```

### Web Application Side

The `.env` file on the `0-X-SNAPSHOT` branch already contains:
```bash
VITE_API_TOKEN=changeme
VITE_API_BASE=http://127.0.0.1:4000
```

## Running Tests

### Server Tests

Navigate to `myhomegames-server`:

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch
```

The test suite covers:
- Authentication endpoints
- API endpoints (GET, POST, PUT)
- Helper functions
- Game loading and settings management

## Development Workflow

1. Start the server in development mode (`npm run dev` in `myhomegames-server`)
2. Start the web application in development mode (`npm run dev` in `myhomegames-web`)
3. Make changes to the code
4. The server will auto-reload with `nodemon`
5. The web application will hot-reload with Vite

## Branch Strategy

- **`main` branch**: Production configuration
  - Server: Uses Twitch OAuth for authentication
  - Web: Production `.env` with `VITE_DISCOVERY_SERVICE` and no `VITE_API_TOKEN`
  
- **`0-X-SNAPSHOT` branch**: Development configuration
  - Server: Uses `API_TOKEN=changeme` for development
  - Web: Development `.env` with `VITE_API_TOKEN=changeme` and local `VITE_API_BASE`

## Troubleshooting

### Server won't start
- Check that port 4000 is available
- Verify `.env` file exists and contains required variables
- Check console for error messages

### Web application won't start
- Verify `VITE_API_BASE` is set in `.env`
- Check that the server is running on the configured port
- Ensure Node.js version is v18 or higher

### Authentication issues
- Verify `API_TOKEN` matches between server and web app (if using development token)
- Check that Twitch OAuth is properly configured (for production)
- Review server logs for authentication errors

