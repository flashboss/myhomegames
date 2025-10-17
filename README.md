# myhomegames


## myhomegames-server

npm install
npm run dev

## myhomegames-web

Starter MyHomeGames Web App (React + TypeScript + Tailwind)
Instructions:
1) Create a Vite React + TS project: `npm create vite@latest myhomegames-web -- --template react-ts`
2) Install Tailwind and postcss per Tailwind docs.
3) Copy this file to src/App.tsx and run `npm install` `npm run dev`.
4) Provide environment variables (see README below).

Notes:

- This is a web front-end for MyHomeGames, a personal videogame management server.
- Replace API_BASE with your backend API endpoint.
- Expected endpoints:
  GET /libraries -> list of libraries
  GET /libraries/:id/games -> games in library
  GET /launcher?gameId=... -> launches game or returns stream URL
- Environment variables:
  VITE_API_BASE=http://127.0.0.1:4000
  VITE_API_TOKEN=YOUR_API_TOKEN

  npm install
  npm run dev

