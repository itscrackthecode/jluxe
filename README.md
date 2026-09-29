# JLUXE Frontend

Next.js + TypeScript + Tailwind CSS starter for the JLUXE website.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Architecture

- `src/app` — routes and global styles
- `src/components` — reusable interactive UI
- `src/lib/data.ts` — temporary mock content

The mock data is intentionally separate from components so it can later be replaced by the JLUXE API without redesigning the UI.
