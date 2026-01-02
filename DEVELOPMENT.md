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

### Running with HTTPS (Development Only)

For local development with HTTPS support, the server can run both HTTP and HTTPS simultaneously.

#### 1. Generate SSL Certificates

SSL certificates are already generated in the `certs/` directory. If you need to regenerate them:

```bash
# From the project root
mkdir -p certs
openssl genrsa -out certs/key.pem 2048
openssl req -new -x509 -key certs/key.pem -out certs/cert.pem -days 365 -subj "/CN=localhost"
```

**Note**: These are self-signed certificates for development only. In production, use proper SSL certificates provided by your hosting provider.

#### 2. Configure Server for HTTPS

Add the following to your server `.env` file (`myhomegames-server/.env`):

```env
# HTTP server (always available)
HTTP_PORT=4000

# HTTPS server (optional)
HTTPS_ENABLED=true
HTTPS_PORT=4443
SSL_KEY_PATH=./certs/key.pem
SSL_CERT_PATH=./certs/cert.pem
```

#### 3. Start the Server

Start the server as usual:

```bash
cd myhomegames-server
npm run dev
```

The server will start:
- **HTTP**: `http://localhost:4000` (always available)
- **HTTPS**: `https://localhost:4443` (if `HTTPS_ENABLED=true`)

#### 4. Configure Web Application for HTTPS

To use HTTPS in the web application, add to your web `.env` file (`myhomegames-web/.env`):

```env
# Use HTTPS API
VITE_API_BASE=https://localhost:4443

# Enable HTTPS for Vite dev server (optional)
VITE_HTTPS_ENABLED=true
```

Then start the web application:

```bash
cd myhomegames-web
npm run dev
```

The web application will be available at:
- **HTTP**: `http://localhost:5173` (default)
- **HTTPS**: `https://localhost:5173` (if `VITE_HTTPS_ENABLED=true`)

#### Browser Security Warning

When using self-signed certificates, your browser will show a security warning. This is normal for development:
1. Click "Advanced" or "Show Details"
2. Click "Proceed to localhost" or "Accept the Risk and Continue"

For a better development experience without warnings, you can use `mkcert` to generate trusted certificates:

```bash
# Install mkcert (macOS)
brew install mkcert
mkcert -install

# Generate trusted certificates
cd certs
mkcert localhost 127.0.0.1
mv localhost+1.pem cert.pem
mv localhost+1-key.pem key.pem
```

**Important**: HTTPS in development is optional. The server always provides HTTP access. Use HTTPS only when testing features that require it (like Twitch OAuth callbacks in some scenarios).

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

- `PORT` (default: `4000`) - Port on which the server will listen (used for HTTP if `HTTP_PORT` is not set)
- `HTTP_PORT` (default: `PORT` or `4000`) - Port for HTTP server (always available)
- `HTTPS_ENABLED` (default: `false`) - Enable HTTPS server (`true`/`false`)
  - When `true`, the server will also listen on HTTPS port
  - **Development only**: Uses self-signed certificates from `certs/` directory
  - **Production**: HTTPS is handled by your hosting provider/reverse proxy
- `HTTPS_PORT` (default: `4443`) - Port for HTTPS server (only if `HTTPS_ENABLED=true`)
- `SSL_KEY_PATH` (default: `./certs/key.pem`) - Path to SSL private key file (relative to project root)
- `SSL_CERT_PATH` (default: `./certs/cert.pem`) - Path to SSL certificate file (relative to project root)
- `API_TOKEN` - Authentication token for API requests (development only, optional)
  - Default: `changeme` (from `.env.example`)
  - Used for quick testing without setting up Twitch OAuth
- `API_BASE` - Base URL of the API server (optional for development)
- `METADATA_PATH` - Path where game metadata are stored
  - Default: `$HOME/Library/Application Support/MyHomeGames`

### Web Application Environment Variables

For development, the web application uses:

- `VITE_API_BASE` - Base URL of the API server
  - Development (HTTP): `http://127.0.0.1:4000`
  - Development (HTTPS): `https://localhost:4443`
- `VITE_API_TOKEN` - Authentication token for development (optional)
  - Development: `changeme`
  - Only used when Twitch OAuth is not configured
- `VITE_HTTPS_ENABLED` (default: `false`) - Enable HTTPS for Vite dev server (`true`/`false`)
  - When enabled, Vite will serve the app over HTTPS using the same certificates as the server

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

### HTTPS issues
- **HTTPS server not starting**: Check that `HTTPS_ENABLED=true` in server `.env`
- **Certificate errors**: Verify that `certs/key.pem` and `certs/cert.pem` exist and are readable
- **Browser security warning**: This is normal with self-signed certificates. Accept the exception or use `mkcert` for trusted certificates
- **Port conflicts**: Ensure ports 4000 (HTTP) and 4443 (HTTPS) are available, or change them via `HTTP_PORT` and `HTTPS_PORT`
- **Vite HTTPS not working**: Verify `VITE_HTTPS_ENABLED=true` in web `.env` and that certificates are accessible from the web directory

