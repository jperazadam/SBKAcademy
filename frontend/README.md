# SBKAcademy Frontend

## Stack

- **React 19** + Vite + TypeScript
- **Tailwind CSS v4** via `@tailwindcss/vite`

## Scripts

```bash
npm run dev      # Start Vite dev server (puerto 5173)
npm run build    # Build for production
npm run lint     # Run ESLint
npm run test     # Run Vitest unit/component tests
npm run test:watch  # Run Vitest in watch mode
```

## Testing

Tests run with **Vitest** + **React Testing Library** + **jsdom**.

- Test files live alongside components: `src/components/SomeComponent.test.tsx`
- Setup: `src/test/setup.ts` (imports jest-dom matchers)
- Run from `frontend/` directory

### Scope

- ✅ Unit and component tests
- ✅ DOM queries and jest-dom assertions
- ❌ E2E / Playwright (deferred to future work)
- ❌ Browser-mode / real-browser tests

## Desarrollo

```bash
npm install
npm run dev
```

Abrir http://localhost:5173