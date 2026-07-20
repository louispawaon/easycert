# AGENTS.md — Ditto (EasyCert)

## Commands

```
npm run dev       # next dev --turbopack (port 3000)
npm run build     # next build
npm run lint      # next lint (ESLint flat config: next/core-web-vitals + next/typescript)
npx tsc --noEmit  # typecheck (no npm script for this)
```

- Either npm or pnpm works — both lockfiles exist. Don't add a third.
- No test framework, no tests, no CI, no pre-commit hooks, no formatter.

## Architecture

- **Mostly client-side.** State is persisted in browser IndexedDB (Dexie). The only server endpoint is `/api/verify/issue`.
- **Dexie DB schema** (`lib/db/ditto-db.ts`) is at version 6. V4 migration renames old fields, V5 rewrites `name→dynamic-text` in text elements, V6 rewrites `qr→proof-link` in design elements. Always bump the Dexie version number when changing the schema.
- **`serverExternalPackages: ["jspdf"]`** in `next.config.ts` — required because jspdf cannot be bundled. Don't remove it.
- **`@/*` path alias** maps to `./*` (project root).

## Conventions

- **Legacy names are deprecated.** Use `RecordTable`, `RecordEntryTab`, `templateImageUrl`, `designElements`. The old `Attendee*`/`Certificate*`/`textElements` re-exports exist for backward compat only — don't use them in new code. See `SPEC.md` for the full transition plan.
- **Project file import** (`lib/project/`) supports `.easycert` (v1) and `.ditto` (v2-3) with backward-compatible field aliasing.
- **Type system note:** `TextElementType` is now `'dynamic-text' | 'static' | 'name'` where `'name'` is legacy. Use `'dynamic-text'` in new code. The `variable` field replaces `variableColumn` (both still accepted via `@deprecated` layer). Dexie v5 migration rewrites old elements on upgrade. `DesignElement` is `TextElement | ProofLinkElement` (previously `QrElement`); `'proof-link'` replaces `'qr'`, with `QrElement`, `isQrElement`, and `createQrElement` kept as `@deprecated` re-exports.
- **Fonts:** 16 Google Fonts loaded in the root layout (`app/layout.tsx`) via `next/font/google`, plus custom user-uploaded fonts persisted in IndexedDB.
- Commits MUST NOT be co-authored by the AI/agent.
- NEVER commit or push changes unless explicitly requested by the user.

## Env

`.env` contains `NEXT_PUBLIC_SITE_URL` and `VERIFY_SECRET`. The `.gitignore` pattern `.env*` ignores all env files — never commit secrets.
