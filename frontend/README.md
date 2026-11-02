# URL Shortener frontend

React + TypeScript single-page app for the URL shortener, built with Vite and styled with Tailwind CSS.

## Development

Requires Node.js 20.19+ or 22.12+. Start the backend first (`./mvnw spring-boot:run` from the repo root), then:

```bash
npm install
npm run dev      # http://localhost:5173
```

Vite proxies `/createURL` to `http://localhost:8080` (see `vite.config.ts`), so no CORS setup is needed.

## Scripts

| Command           | Description                         |
|-------------------|-------------------------------------|
| `npm run dev`     | Dev server with hot reload          |
| `npm run build`   | Type-check and build to `dist/`     |
| `npm run preview` | Serve the production build locally  |
| `npm run lint`    | Lint with oxlint                    |

## Structure

```
src/
├── components/   # UI: HeroCut, ShortenForm, DatePicker, TimeInput, ResultCard,
│                 #     RecentLinks, CopyButton, ThemeToggle
├── hooks/        # useRecentLinks, useLocalStorage, useTheme, useNow
├── lib/          # API client, date helpers, class-name helper
├── App.tsx       # Page layout
└── main.tsx      # Entry point, React Query provider
```

Recent links are stored in the browser's `localStorage`, not on the server.
