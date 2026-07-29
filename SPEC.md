# Ditto Transition Spec — From EasyCert Legacy to Final Form

> Scope: this spec drives the codebase from its current state (marketing-ready Ditto, architecture still shaped like EasyCert) to the product described in `MARKET_ANALYSIS.md`.

> Mindset: Ditto is not an MVP. It is the final evolution of the product. EasyCert was the earlier form; Ditto is what ships.

---

## Pre-Spec Comments — Answered

### 1. QR / Verification Feature

**Decision:** Keep it, but reframe it.

The QR/verification page is a legitimate way to make a design feel official and verifiable. It is also already optional — the user must explicitly insert it. The issue is naming, not existence. Instead of a "Verification QR" that screams certificate, it becomes a **Proof Link** element.

**How it works:**
- The element represents a **signed, shareable proof link**.
- It can render as a QR code on the design, but the link itself is the real output.
- A generated design with this element produces both a QR code and a URL (`/v/{token}`) that anyone can open to verify the output.

**Categorization:** With only four element types, a heavy taxonomy is unnecessary. A simple visual grouping is enough:
- **Text** — Static, Dynamic Text
- **Proof** — Proof Link (renders as QR)

This keeps the architecture clean without over-engineering categories.

### 2. Manual / Paste Mode

**Decision:** Replace the single "Paste Names" mode with a **flexible data entry panel**.

Current manual mode only supports a single-column list of names. That is too narrow for a general personalization tool. Users should be able to paste tabular data in the same way they upload CSV/XLSX.

**How it works:**
- The manual tab becomes a **Data Input** tab with three sub-modes:
  - **Simple List** — current behavior; one value per line.
  - **Table** — tab-separated or comma-separated input parsed into rows and columns. A mini table editor lets users adjust headers and cells.
  - **JSON** — paste an array of objects or an array of strings; parsed into rows.
- All three modes normalize into the same `AttendeeTable` (to be renamed `RecordTable`) data model.
- The user can switch between manual and file upload without losing data, and can edit the parsed table directly.

### 3. Limited Output Formats

**Decision:** Add a production-grade **Output Settings** panel.

PNG ZIP and PDF cover many cases, but a final-form product needs to handle different use cases natively. The Generate step gets an output settings area.

**How it works:**
- **Formats:** PNG, PDF, SVG, WebP.
- **Scale / Resolution:** Output at original size, 2× retina, or a custom scale.
- **Filename Pattern:** Use template variables from the data, e.g. `{name}`, `{serial}`, `{row}`, `{index}`.
- **Output Presets:** Common bundles like "PNG ZIP + PDF" or "SVG bundle".
- **Post-Generation Report:** A download summary that ties back to the audit, listing flagged records that were still generated with warnings.

---

## Guiding Principles

1. **Ditto is a bulk design personalization tool.** Every feature must help users personalize an existing design across many records.
2. **No certificate-specific assumptions in core code.** The product may still show certificates as a use case, but the engine should not know what a certificate is.
3. **Real data, real preview.** The canvas shows actual row values, not placeholders.
4. **Trust every output.** Warnings are visible early and persist through generation.
5. **Backward compatibility where cheap, correctness where not.** Legacy project files and old localStorage data should migrate cleanly.

---

## Phase 1 — Foundation & Domain Language

**Goal:** Remove EasyCert-shaped language from the codebase without changing behavior.

### 1.1 Rename Domain Entities

| Current | New |
|---|---|
| `attendee` | `record` |
| `attendees` | `records` |
| `attendeeTable` | `recordTable` |
| `attendeeListText` | `recordListText` |
| `attendeeEntryTab` | `recordEntryTab` |
| `certificateImageUrl` | `templateImageUrl` |
| `namePlaceholders` | `dynamicTextElements` |
| `issuer` | `organization` or `issuer` (kept only for Proof Link context) |
| `generateCertificates` | `generateOutputs` |
| `generateCertificateImagesBatch` | `generateImageBatch` |

**Rules:**
- Rename files, types, functions, and component props.
- Keep exported aliases if needed during transition, but mark them `@deprecated`.
- Do not change behavior. This is a pure refactor.

### 1.2 Update User-Facing Copy

- Replace "Attendee" with "Record" in the workspace UI.
- Replace "Certificate" with "Output" where it refers to a generated file.
- Keep "Certificate" only in the landing page as a listed use case.

### 1.3 Update Privacy Page

- Replace references to "EasyCert" with "Ditto".
- Frame stored data as "design template, record data, layout, and fonts" instead of "certificate project data."

### 1.4 Landing Page Cleanup

- Rotate the hero demo through multiple use cases: certificate, event badge, name card, invitation, ID card.
- Update the `data-aware.tsx` demo button from "Generate 497 certificates" to "Generate 497 outputs."

### 1.5 Deliverables

- All `attendee` / `certificate` identifiers in `lib/`, `hooks/`, `components/` renamed.
- Privacy page copy updated.
- Landing page examples diversified.

---

### 1.5 Completion Notes (2026-07-18)

**Completed.** All domain rename targets applied.

**Type system:**
- `AppStateRecord` fields renamed: `templateImageUrl`, `recordListText`, `recordTable`, `recordEntryTab`.
- `RecordEntryTab`, `RecordTable` replace `AttendeeEntryTab`, `AttendeeTable`.
- `RecordDrawContext` replaces `AttendeeDrawContext` with fields `recordLabel`, `record`, `headers`.

**Persistence:**
- Dexie v3 → v4 upgrade rewrites old field keys to new ones in IndexedDB.
- `normalizeAppStateRecord()` fallback reads both old and new keys at read boundaries.
- `validateAppState` in `lib/project/ditto-file.ts` accepts both `certificateImageUrl`/`templateImageUrl`, `attendeeListText`/`recordListText`, etc. Legacy `.ditto`/`.easycert` files continue to import.
- localStorage legacy keys (`certificateImageUrl`, `attendeeList`) kept in migration code for one-time browser upgrade.

**File moves (old files kept as `@deprecated` re-exports):**
| Old | New |
|---|---|
| `lib/attendees/attendee-dataset.ts` | `lib/records/record-dataset.ts` |
| `lib/demo-attendees.ts` | `lib/demo-records.ts` |
| `lib/csv/parse-attendee-csv.ts` | `lib/csv/parse-record-csv.ts` |
| `lib/xlsx/parse-attendee-xlsx.ts` | `lib/xlsx/parse-record-xlsx.ts` |
| `hooks/useAttendees.ts` | `hooks/useRecords.ts` |
| `components/file-upload/AttendeeUpload.tsx` | `components/file-upload/RecordUpload.tsx` |

**Deprecated aliases retained for backward compat:**
- `saveAttendeeListText`, `saveAttendeeTable`, `saveAttendeeEntryTab`
- `generateCertificatesBatch`, `generateCertificateImagesBatch`, `sanitizeAttendeeForFilename`
- `useCertificateDesigner`, `CertificateDesignerController`, `useCertificateTemplateImage`
- `AttendeeDrawContext`, `AttendeeEntryTab`, `AttendeeTable`
- `DEMO_ATTENDEES`, `isAttendeeLinesMode`, `parseAttendeeCsv`, `parseAttendeeXlsx`

**User-facing copy updated:**
- UI labels: "Record" replaces "Attendee", "Template & Records" replaces "Template & Attendees", "Paste Records" replaces "Paste Names".
- Generate panel: "dynamic text" replaces "name placeholders", "record name" replaces "attendee name".
- Audit: "No dynamic text field placed on the design" replaces "No name field placed on the design".
- `app/privacy/page.tsx`: "EasyCert" → "Ditto", "certificate generation" → "output generation", "Certificate template images, attendee lists" → "Design template images, record data", "Verification" → "Proof".
- `components/verification/VerificationResult.tsx`: "certificates and personalized outputs" → "personalized outputs".
- `components/landing/data-aware.tsx`: "Generate 497 certificates" → "Generate 497 outputs".
- `components/landing/the-shift.tsx`: "A bulk certificate generator." → "A bulk output generator.", code pill `Certificates` → `Outputs`.

**Deferred from Phase 1:**
- Hero demo rotation through multiple use cases → moved to Phase 6.
- "Certificates" intentionally remains as a use case label on the landing page per SPEC 1.2.

**Phase 1.4 (Landing Page Cleanup) items left for Phase 6:**
- Hero demo auto-rotation through use cases (certificate, event badge, name card, invitation, ID card).

---

## Phase 2 — Data Model & Element Architecture

**Goal:** Make the engine design-agnostic and variable-driven.

### 2.1 Generic Text Element Model

Replace the current type system:

```ts
// Before
type TextElementType = 'name' | 'static';

// After
type TextElementType = 'dynamic-text' | 'static';

type TextElement = {
  id: string;
  type: TextElementType;
  variable?: string; // column key for dynamic-text; undefined for static
  x: number;
  y: number;
  maxWidthPct: number;
  fontSize: number;
  fontFamily: string;
  fontStyle: 'normal' | 'italic';
  fontWeight: 'normal' | 'bold';
  textDecoration: 'none' | 'underline';
  color: string;
  value: string | null; // for static text only
};
```

**Rules:**
- A `dynamic-text` element with no `variable` falls back to the first column.
- A `static` element ignores `variable`.
- `value` is only meaningful for `static`.
- Rename `createNameElement` to `createDynamicTextElement`.
- Rename `createStaticElement` stays.

### 2.2 Migration Strategy

- On load, migrate existing `type: 'name'` elements to `type: 'dynamic-text'` with `variable` set from `variableColumn`.
- `type: 'static'` stays as-is.
- Project file format version bumps to `4`.
- Legacy project files (`.easycert`, `.ditto` v3) continue to import through the migration path.

### 2.3 Flexible Manual Data Entry

Replace the single manual paste textarea with a tabbed data input panel:

**Simple List**
- One value per line.
- Normalizes to a single-column table with header `Value` (or auto-detected as `name` if user is coming from old paste mode).

**Table**
- Accepts tab-separated, comma-separated, or pipe-separated input.
- Shows a live editable table with headers.
- User can add/remove rows and columns.
- Header normalization is applied on blur.

**JSON**
- Accepts `string[]` or `Record<string, string>[]`.
- String arrays become single-column tables.
- Object arrays become multi-column tables.

**Rules:**
- All three modes produce the same `RecordTable` data model.
- Switching between manual and upload modes preserves data where possible.
- The first column is used as the default filename column unless the user picks another.

### 2.4 Draw Context Update

Rename `AttendeeDrawContext` / `RecordDrawContext` fields:

```ts
// Before
AttendeeDrawContext = {
  attendeeName?: string;
  attendeeRow?: Record<string, string>;
  tableHeadersOrdered?: string[];
};

// After
RecordDrawContext = {
  recordLabel?: string;
  record?: Record<string, string>;
  headers?: string[];
};
```

Update `resolveElementText` to use the new generic model.

### 2.5 Deliverables

- Generic `TextElement` model.
- Migration path for old elements.
- Flexible manual data entry UI.
- Draw context renamed and generic.

---

### 2.6 Completion Notes (2026-07-20)

**Completed.** All Phase 2 deliverables implemented.

**Type system:**
- `TextElementType = 'dynamic-text' | 'static' | 'name'` where `'name'` is legacy only (`types/types.ts:3`).
- `createDynamicTextElement` is the canonical factory; `createNameElement` kept as `@deprecated` alias (`types/types.ts:52-74`).
- `variable` field replaces `variableColumn`; `variableColumn` kept as `@deprecated` for project file migration (`types/types.ts:20`).

**Migration:**
- Dexie v5 rewrites `type: 'name'` → `'dynamic-text'` and `variableColumn` → `variable` (`lib/db/ditto-db.ts:95-118`).
- `migrateTextElement` in `lib/canvas/migrate-text-element.ts` handles both legacy fields at import boundaries.
- Project file format bumped to v5 (`lib/project/ditto-file.ts:12`).

**Manual data entry:**
- Three sub-modes: Simple List, Table, JSON (`components/file-upload/RecordUpload.tsx:257-261`).
- `RecordManualMode = "simple" | "table" | "json"` type (`lib/db/ditto-db.ts:11`).
- Modes persist through `patchAppState({ recordManualMode })` and survive project export/import.
- JSON mode accepts `string[]` or `Record<string, string>[]`; Table mode accepts tab/CSV/pipe.

**Draw context:**
- `RecordDrawContext` with `recordLabel`, `record`, `headers` (`lib/canvas/draw-text-element.ts:16-28`).
- `resolveElementText` uses the new model with fallback to deprecated fields (`lib/canvas/draw-text-element.ts:33-71`).
- `AttendeeDrawContext` retained as `@deprecated` re-export.

---

## Phase 3 — Element System & Proof Link

**Goal:** Cleanly categorize the small element set and reframe the QR feature as a shareable proof link.

### 3.1 Element Categories

Introduce a lightweight visual grouping in the sidebar:

- **Text**
  - Dynamic Text
  - Static Text
- **Proof**
  - Proof Link

This is for UI organization only. The data model does not need a separate category field.

### 3.2 Proof Link Element

Rename the current QR element concept:

```ts
type ProofLinkElement = {
  id: string;
  type: 'proof-link';
  x: number;
  y: number;
  sizePct: number;
  color: string;
  bgColor: string;
  transparentBg: boolean;
  urlTemplate: string; // with {token} placeholder
};
```

**Rules:**
- The element renders as a QR code on the canvas.
- The generated output includes a signed token URL that resolves to `/v/{token}`.
- The verification page is renamed to **Proof Page** and copy updated to be design-agnostic.
- The `issuer` field on the element editor is kept but labeled "Issuing organization" and only relevant when a Proof Link exists.

### 3.3 UI Changes

- "Insert Verification QR" button becomes **Insert Proof Link**.
- QR editor panel becomes **Proof Link Properties**.
- Verification result page says "This design was verified" instead of "certificate."

### 3.4 Deliverables

- `proof-link` element type.
- Renamed verification flow to proof flow.
- Updated UI labels and proof page copy.

---

### 3.5 Completion Notes (2026-07-20)

**Completed.** All Phase 3 deliverables implemented.

**Proof Link element:**
- `ProofLinkElement` type with `type: 'proof-link'` and all specified fields (`types/types.ts:23-38`).
- `createProofLinkElement`, `isProofLinkElement` created; `createQrElement`, `isQrElement`, `QrElement` kept as `@deprecated` aliases.
- Proof link renderer at `lib/canvas/proof-link-render.ts` with size normalization, QR generation, margin/error correction.

**Categories:**
- Sidebar has **Text** (Insert Record Name, Insert Selected Info, Insert Subtext) and **Proof** (Insert Proof Link) groups with a visual separator (`components/design-editor/DesignControls.tsx:163-251`).

**API & proof page:**
- `POST /api/proof/issue` issues signed compact tokens (`app/api/proof/issue/route.ts`).
- Proof page at `/v/[token]` verifies tokens and displays a design-agnostic "Proof Link" result (`app/v/[token]/page.tsx`).
- Legacy `/api/verify/issue` endpoint retained via `@deprecated` re-export.

**UI labels:**
- Zero instances of "Verification QR" remain in the codebase; all UI labels use "Proof Link", "Proof Link Properties".
- Proof page says "This proof link was verified and is authentic" — no certificate language.

---

## Phase 4 — Output Engine & Settings

**Goal:** Move beyond PNG/PDF to a production output system.

### 4.1 Output Settings Panel

Add a collapsible **Output Settings** section in the Generate step.

**Settings:**
- **Format:** PNG, PDF, SVG, WebP.
- **Scale:** Original, 2×, Custom (e.g. 0.5×, 3×).
- **Filename pattern:** Template string with variables.
  - `{name}` — resolved from filename column.
  - `{serial}`, `{role}`, etc. — resolved from any column.
  - `{index}` — row number.
  - `{row}` — alias for `{index}`.
- **Output preset:** PNG + PDF bundle, SVG bundle, etc.

### 4.2 Filename Pattern

Default patterns:
- `output_{name}` for individual files.
- `output_{index}` for fallback.

User can customize. Invalid filename characters are stripped per row value.

### 4.3 SVG Export

- Render the template image as an embedded raster or linked image.
- Render text as SVG `<text>` elements using the same font/style resolution.
- QR code as SVG paths.

### 4.4 WebP Export

- Use canvas `toBlob` with `image/webp` MIME type.
- Bundle into ZIP or PDF depending on format selection.

### 4.5 Batch Engine Refactor

- Rename `generateCertificatesBatch` to `generateOutputBatch`.
- Accept a selected format and options object.
- Return a ZIP of mixed files or a single PDF.

### 4.6 Deliverables

- Output settings panel.
- Filename pattern engine.
- SVG and WebP export support.
- Refactored batch engine.

---

### 4.7 Completion Notes (2026-07-20)

**Mostly complete — one gap: SVG export.**

**Done:**
- Output settings panel: collapsible section in Generate step with format, scale, filename pattern, and output preset selectors (`components/design-editor/GeneratePanel.tsx:195-208`).
- `OutputSettings` type with `OutputFormat`, `OutputBundle`, scale presets (`lib/output/output-settings.ts`).
- Format support: **PNG** (ZIP), **WebP** (ZIP), and **PDF** (single document). WebP uses `canvas.toBlob("image/webp")` per SPEC 4.4.
- Scale: Original (1×), Retina (2×), Custom (0.1×–5×), wired through to `renderToCanvas()` in batch engine.
- Filename pattern engine with `{name}`, `{index}`, `{row}`, and arbitrary column variables (`lib/output/filename-pattern.ts`). Default `output_{name}` / `output_{index}`.
- Output presets: PNG ZIP + PDF or WebP ZIP + PDF bundles.
- Batch engine refactored: `generateOutputsBatch(settings, opts)` as canonical entry; `generateCertificatesBatch`, `generateCertificateImagesBatch` kept as `@deprecated`.

**Not done:**
- **SVG export** — `"svg"` is not in `OutputFormat` union; no SVG rendering, no `<text>` elements, no linked/embedded raster, no SVG-path QR generation. See SPEC 4.3 for the required SVG export behavior.

---

## Phase 5 — Trust & Generation Reporting

**Goal:** Surface problems earlier and give users a clear post-generation summary.

### 5.1 Continuous Audit

- Run the pre-generation audit whenever the user is on the Design step and has both a template and records.
- Show a compact audit summary in the Design sidebar (collapsible).
- Use the same `computePreGenerationAudit` function; only the trigger changes.

### 5.2 Post-Generation Report

After a batch completes, show a summary modal or inline panel:

- Total records generated.
- Number of records generated with warnings.
- List of flagged records with their issues (overflow, missing value, etc.).
- Download link for the output file.
- Option to download a separate "report.txt" or "report.csv" with warnings.

**Rules:**
- The report ties directly to the audit findings.
- Warnings do not block generation unless they are blocking errors.
- Users can dismiss the report or choose to stop and fix issues.

### 5.3 Smart Pre-Generation Checks

- If the audit has blocking errors, disable the Generate button and show the errors.
- If only warnings exist, allow generation but warn the user before proceeding.

### 5.4 Deliverables

- Audit summary visible in Design step.
- Post-generation report tied to audit findings.
- Generate button behavior based on audit severity.

---

### 5.5 Completion Notes (2026-07-20)

**Completed.** All Phase 5 deliverables implemented.

**Continuous audit:**
- `usePreGenerationAudit` runs whenever wizard step is Design (1) or Generate (2) (`hooks/useDesignerController.ts:127-137`).
- Collapsible audit summary in Design sidebar with severity badges, error/warning counts, and individual findings (`components/design-editor/DesignAuditSummary.tsx:34-146`).

**Generate button behavior:**
- Blocking errors (`auditReport.blocking === true`) disable the Generate button and show an error panel (`components/design-editor/GeneratePanel.tsx:171,507,433-444`).
- Warnings-only show a confirmation gate on first click ("Generate anyway" / "Cancel") before proceeding (`components/design-editor/GeneratePanel.tsx:445-486`).

**Post-generation report:**
- `GenerationReportPanel` renders after batch completes with total records, warning count, flagged records per finding, and TXT/CSV download buttons (`components/design-editor/GenerationReportPanel.tsx:18-91`).
- `GenerationReport` type ties directly to `AuditReport` findings (`lib/output/generation-report.ts:9-16`).
- Report downloads via `downloadReportTxt()` and `downloadReportCsv()` (`lib/output/report-download.ts:26-70`).

---

## Phase 6 — Polish & Cleanup

**Goal:** Final consistency pass and quality improvements.

### 6.1 Consistency Sweep

- Ensure no `attendee`, `certificate`, or `name` element language remains in `lib/`, `hooks/`, `components/`.
- Verify all user-facing labels use the new domain language.

### 6.2 Landing Page Finalization

- Hero demo cycles through use cases.
- All CTAs point to `/generate`.
- Update OpenGraph metadata to match final messaging.

### 6.3 Tests

Add tests after the rework is complete:
- CSV/XLSX parsing edge cases.
- Project file migration from v3 to v4.
- Audit logic for overflow, missing values, duplicates, off-canvas elements.
- Proof token signing and verification.

### 6.4 Decision Filter

Defer formal documentation. The product is small enough that the principle is enforced through review rather than a written checklist.

### 6.5 Deliverables

- Clean codebase with no legacy domain language.
- Updated landing page.
- Test suite for critical paths.

---

### 6.6 Completion Notes (2026-07-20)

**Consistency sweep — partially complete.** Hero demo cycling and tests deferred.

**User-facing copy cleaned:**
- `components/generate-onboarding/generate-onboarding-config.ts`: substep id `upload-attendees` → `upload-records`; "add a name field" → "add a dynamic text field".
- `components/file-upload/RecordUpload.tsx`: Table placeholder `John Doe\tAttendee` → `Alex Rivera\tEngineer`; JSON placeholder `"role": "Attendee"` → `"role": "Engineer"`.
- `components/landing/data-aware.tsx`: "Names may overflow" → "Values may overflow".
- `components/landing/the-shift.tsx`: "From a certificate tool" → "From a single-purpose tool".

**Deferred from Phase 6:**
- Hero demo auto-rotation through use cases (certificate, event badge, name card, invitation, ID card) — deferred.
- Test suite for critical paths (CSV/XLSX parsing, project migration, audit logic, proof tokens) — deferred, no test framework installed.
- ESLint config is broken (Next.js 16 + ESLint 10 / FlatCompat circular JSON) — pre-existing, not introduced in Phase 6.

**Kept intentionally (backward compatibility):**
- Deprecated aliases: `AttendeeUpload`, `AttendeeTable`, `AttendeeEntryTab`, `AttendeeDrawContext`, `useAttendees`, `useCertificateDesigner`, `useCertificateTemplateImage`, `createNameElement`, `NAME_PLACEHOLDER`, `createQrElement`, `isQrElement`, `generateCertificatesBatch`, `generateCertificateImagesBatch`, `sanitizeAttendeeForFilename`, `parseAttendeeCsv`, `parseAttendeeXlsx`, `isAttendeeLinesMode`, `saveAttendeeListText`, `saveAttendeeTable`, `saveAttendeeEntryTab`, `QrElement`.
- Legacy fields: `variableColumn`, `type: 'name'` in `TextElementType`.
- Migration code: Dexie v4–v6 upgrades, `normalizeAppStateRecord()` fallbacks, `validateAppState()` dual-key reads, localStorage legacy key migration.

**Landing page use of "certificate" retained per SPEC 1.2:**
- `use-cases.tsx`: "Certificates" as a listed use case, "Beyond certificates" subheading.
- `faq.tsx`: "Is Ditto only for certificates?" (addresses the question directly).
- `live-preview.tsx` / `hero.tsx`: Static "Certificate of Completion" titles left in place pending deferred hero demo rotation.
- `footer.tsx`: "Certificates" in use case links.

---

## Rollout Order

1. **Phase 1** — Domain rename. Pure refactor, low risk. ✅ **COMPLETED** (2026-07-18)
2. **Phase 2** — Data model and flexible paste. Medium risk due to migration. ✅ **COMPLETED** (2026-07-20)
3. **Phase 3** — Proof Link reframe. Low risk, mostly rename. ✅ **COMPLETED** (2026-07-20)
4. **Phase 4** — Output engine. Medium risk, new formats. 🟡 **PARTIALLY COMPLETE** — SVG export missing (2026-07-20)
5. **Phase 5** — Trust/reporting. Low risk, UX addition. ✅ **COMPLETED** (2026-07-20)
6. **Phase 6** — Polish and tests. Low risk. 🟡 **PARTIALLY COMPLETE** — consistency sweep done, hero demo + tests deferred (2026-07-20)

---

## Open Questions

- Should the Proof Link element support multiple URL templates (e.g. generic link vs. signed link), or is a single signed template sufficient?
- Should manual Table mode support copy-paste from Excel directly (HTML tables or rich text)?
- Should SVG export embed the template image as base64, or require the user to keep the template image alongside the SVG?

---

## Definition of Done

- ✅ No `attendee` or `certificate` identifiers in core code (deprecated aliases and legacy migration keys intentionally retained for backward compat).
- ✅ Text elements are `dynamic-text` and `static` (with `'name'` retained as deprecated).
- ✅ Manual data entry supports simple list, table, and JSON.
- ✅ Proof Link replaces Verification QR in UI and concept.
- 🟡 Output settings support PNG, PDF, WebP, scaling, and filename patterns (SVG not yet implemented).
- ✅ Pre-generation audit is visible during Design and a report is shown after generation.
- 🟡 Landing page demonstrates multiple use cases, not just certificates (hero demo auto-rotation deferred).
- ✅ Privacy page is updated to Ditto framing.
