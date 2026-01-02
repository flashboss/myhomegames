# myhomegames

MyHomeGames - Personal videogame management system

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.

## myhomegames-server

- Copy `.env.example` to `.env` before starting
- npm install
- npm run dev

**Note**: The `.env` file contains `API_TOKEN=changeme` for development.

**Note**: Copy `.env.example` to `.env` before starting. The `.env` file contains `API_TOKEN=changeme` for development.

## myhomegames-web

Starter MyHomeGames Web App (React + TypeScript + Tailwind)

Instructions:

- Copy `.env.example` to `.env`:

  ```bash
  cp .env.example .env
  ```

- The `.env` file should contain:

  ```bash
  VITE_API_BASE=http://127.0.0.1:4000
  VITE_API_TOKEN=changeme
  ```

  **Note**: `VITE_API_BASE` is required. The application will not start without it.

Notes:

- This is a web front-end for MyHomeGames, a personal videogame management server.
- Expected endpoints:
  GET /libraries -> list of libraries
  GET /libraries/:id/games -> games in library
  GET /launcher?gameId=... -> launches game or returns stream URL
