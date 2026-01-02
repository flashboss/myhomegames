# MyHomeGames Web

React + TypeScript + Vite application for managing and browsing game collections.

## Building and Running Locally

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Development Mode

To run the application in development mode:

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:5173` (or the port shown in the terminal).

**Note**: The `.env` file is committed to the repository and contains `VITE_API_TOKEN=changeme` for development authentication (on the `0-X-SNAPSHOT` branch). This is only used when Twitch OAuth is not configured.

### Building for Production

To create a production bundle:

```bash
# Build the application
npm run build
```

This will create an optimized production build in the `dist` directory.

**Important**: 
- The `.env` file is committed to the repository
- On the `master` branch: `.env` contains production configuration (no `VITE_API_TOKEN`, production `VITE_API_BASE`)
- On the `0-X-SNAPSHOT` branch: `.env` contains development configuration (`VITE_API_TOKEN=changeme`, local `VITE_API_BASE`)
- Do not set `VITE_API_TOKEN` in production - the application will use Twitch OAuth for authentication

### Preview Production Build Locally

To preview the production build locally:

```bash
# After building, preview the production build
npm run preview
```

This will serve the production build locally, typically at `http://localhost:4173`.

### Server Setup

Make sure the backend server is running. Navigate to the `myhomegames-server` directory:

```bash
cd ../myhomegames-server

# Install dependencies
npm install

# Start the server
npm start

# Or run in development mode with auto-reload
npm run dev
```

**Important**: 
- The `.env` file is committed to the repository with appropriate configuration for each branch
- On the `master` branch: production configuration (no `VITE_API_TOKEN`, production `VITE_API_BASE`)
- On the `0-X-SNAPSHOT` branch: development configuration (`VITE_API_TOKEN=changeme`, local `VITE_API_BASE`)
- The application will not start without `VITE_API_BASE` configured

---

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
