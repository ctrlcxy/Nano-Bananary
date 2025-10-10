# Repository Guidelines

## Project Structure & Module Organization
- `index.tsx` bootstraps the Vite React app and mounts `App.tsx` for global state.
- UI building blocks live in `components/`; reuse logic in `utils/` and types in `types.ts`.
- API interactions sit in `services/geminiService.ts`; keep shared values in `constants.ts`.
- Localization and theming assets live in `i18n/` and `theme/`; update both when adding copy or tokens.

## Build, Test, and Development Commands
- `npm install` syncs dependencies; rerun after editing `package.json`.
- `npm run dev` starts Vite with hot module reload; add `--host` for device testing.
- `npm run build` compiles to `dist/`; inspect the output before publishing.
- `npm run preview` serves the built bundle for production smoke tests.

## Coding Style & Naming Conventions
- Use TypeScript throughout; prefer explicit types from `types.ts` or local interfaces.
- Match the existing 2-space indentation and Prettier-style spacing; only add semicolons when needed.
- Name React components in PascalCase (`components/ThemeSwitcher.tsx`) and utility functions in camelCase; colocate composite hooks under `utils/`.
- Use the root alias `@/` for cross-folder imports when it improves clarity.

## Testing Guidelines
- No automated suite exists yet; when adding one, colocate `*.test.ts` beside sources and wire an `npm test` script.
- Meanwhile run `npm run dev`, exercise upload, history, and Gemini flows in both themes, and record manual checks in PRs.

## Commit & Pull Request Guidelines
- Keep commits focused and present-tense, similar to `feat(app): add comparison slider` or `fix: adjust theme colors`.
- Reference related issues in the commit body or PR description; attach before/after screenshots for UI changes and note env updates.
- PRs should outline scope, manual test steps, and follow-up items.

## Security & Configuration Tips
- Store secrets in `.env.local` (for example `GEMINI_API_KEY=your-key`) and exclude them from commits.
- Document rate limits or flags in `metadata.json` instead of hardcoding them.
- Review new upload or download paths in `services/` for CORS and storage implications.
