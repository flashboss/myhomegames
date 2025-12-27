# myhomegames


## myhomegames-server

- npm install
- npm run dev

## myhomegames-web

Starter MyHomeGames Web App (React + TypeScript + Tailwind)

Instructions:
- Provide environment variables (create a `.env` file in `myhomegames-web/`):
  ```
  VITE_API_BASE=http://127.0.0.1:4000
  VITE_API_TOKEN=YOUR_API_TOKEN
  ```

Notes:

- This is a web front-end for MyHomeGames, a personal videogame management server.
- Expected endpoints:
  GET /libraries -> list of libraries
  GET /libraries/:id/games -> games in library
  GET /launcher?gameId=... -> launches game or returns stream URL

