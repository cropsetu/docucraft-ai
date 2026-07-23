# DocuMind AI — Frontend Build Plan

An AI document-generation platform (HR letters, clinical reports, regulatory sections) inspired by the IBM Content Collaborator screenshots you shared, with a ChatGPT-style chat and a Notion-style editor layered on top.

The full spec is huge (12 pages, 20 advanced features). Building all of it in one pass would produce a shallow, buggy result. I'll ship in phases, each phase usable on its own. This plan covers **Phase 1 + Phase 2 (the core workflow)** — the parts that most match your screenshots. Later phases are listed at the end so we can iterate.

## Scope of this plan (Phase 1 + 2)

Frontend only. All data mocked in-memory (no backend, no auth wiring, no real AI calls yet — chat/editor come in Phase 3). Enable Lovable Cloud + real AI later.

### Design system
- Dark-first theme, semantic tokens in `src/styles.css` (oklch):
  - bg `#0a0a0f`, surface `#14141a`, elevated `#1c1c24`, borders `#26262e` / `#3a3a44`
  - primary electric blue `#4f6bff`, purple accent `#8b5cf6`, gradient `indigo→purple→pink` for hero/AI accents
  - status: success/warning/error/info
- Inter (sans) + JetBrains Mono, loaded via `<link>` in `__root.tsx`
- Radius scale 8/12/16, subtle glassmorphism on modals
- shadcn/ui components, Lucide icons, Framer Motion for transitions, sonner for toasts

### Routes (Phase 1–2)
```
/                           Landing page
/dashboard                  Projects table + create
/projects/:id               5-step accordion workflow
/projects/:id/mapping/:did  3-step mapping wizard
```
Each route gets its own `head()` metadata (title, description, og:title, og:description).

### Global chrome
- Top nav: logo, Cmd+K search (visual only for now), notifications, avatar menu
- Left sidebar: Projects / Chat / Templates / Analytics / Team / Audit / Settings (icons live; non-Phase-1 routes render "Coming soon" placeholders so nav works)

### Page 1 — Landing (`/`)
Replaces the placeholder index. Hero with animated gradient orbs, gradient headline, two CTAs, compliance trust strip, 6-card feature grid, 6 use-case cards, 4-step "how it works", footer.

### Page 2 — Dashboard (`/dashboard`)
The IBM-style screen from your screenshots.
- Welcome banner with gradient text + isometric illustration on the right
- "Content studio (1250)" section header + toolbar (search / filter / refresh / **+ Create project**)
- Projects table with the exact columns from the screenshot (Project name, ID, Document type, Function, Created on, Modified on, Status, Actions), colored function badges, status pills, hover rows, pagination
- Seeded with the 10 sample projects listed in the spec

### Create Project — right-side slide-over
Fields: name, description, region, function (searchable), document type (dynamic per function), language, team members (mock), advanced toggles (approval workflow, audit trail, compliance frameworks). Zod-validated form. Adds to the in-memory store and toasts on success.

### Page 3 — Project detail (`/projects/:id`)
Matches screenshots exactly.
- Breadcrumb + editable title
- Metadata card (Project ID, Region, Function, Document Type, Created/Modified)
- "Document generation process" heading with list/compact view toggle
- 5-step vertical accordion, each with icon, title, count badge, status pill, expand/collapse animation:
  1. **Import template file** — empty state with isometric illustration + "Import template file" button; populated state shows file list. Upload modal (drag-drop, .docx/.dotx/.html/.txt, mock progress bar).
  2. **Import source files** — same pattern for CSV/XLSX/JSON/PDF/DOCX.
  3. **Generation method** — 2×2 radio cards (AI Auto-Generate / Chat-Assisted / Manual Mapping / Hybrid), model dropdown, temperature slider, Save.
  4. **Map data sources to template sections** — empty state → "Create draft document" modal; populated state shows draft cards (date, name, creator, mapping count, description, "Map content →"). Success toast matches screenshot.
  5. **View draft documents** — list of generated docs with Preview / Download / Edit / Regenerate row actions; bulk-select bar.
- Left sub-sidebar within the project: Content Generation (active), Content Review, Chat, Settings, Activity (Phase 1: only Content Generation functional, others show placeholder)

### Page 4 — Mapping interface (`/projects/:id/mapping/:draftId`)
Matches your last screenshot.
- 60/40 split
- Left: horizontal 3-step stepper (Template → Action → Source)
  - Step 1: template dropdown, section tree with checkboxes, "Select all", info banner "All selected sections will use the same action…"
  - Step 2: 4 action radio cards (Replace / Append / Insert at position / AI Transform) + optional AI instructions
  - Step 3: source dropdown, data preview, variable↔field mapping with "Auto-map with AI" button (mocked)
- Right: sticky Mapping Preview card that updates live
- Bottom bar: Back / Next / Save + "Step X of 3"

### State & data
- Zustand store for projects, templates, sources, drafts, generated docs — seeded with the sample data from the spec so the app feels populated on first load.
- All "AI" actions are mocked with `setTimeout` + realistic streaming feel where relevant.
- No Cloud/Supabase yet — everything client-side and in-memory. I'll flag this so you know refresh clears state; we'll wire Cloud + real persistence in Phase 3.

### Technical notes
- TanStack Start file-based routing under `src/routes/`; dynamic segments use `$id` / `$draftId`.
- Rewrite `src/routes/index.tsx` (the placeholder) as the landing page. Dashboard lives at `/dashboard`.
- Shared app shell (top nav + sidebar) rendered from a `_app` pathless layout wrapping dashboard/project routes; landing page opts out.
- Isometric illustrations for empty states generated as SVG assets (matching the box/cube/layers/network motifs from your screenshots), tinted with the app's purple/blue palette.

## Not in this plan (future phases)

- Phase 3: Chat interface (`/projects/:id/chat`), Document editor (`/projects/:id/edit/:docId`) with TipTap + AI assistant panel — wired to real Lovable AI (`openai/gpt-5.5`) after Cloud is enabled.
- Phase 4: Template library, Analytics, Team, Settings, Audit log, Approval workflows.
- Phase 5+: Advanced features (bulk generation, compliance checks, e-signature, prompt library, API, onboarding tour, white-label, etc.).

We can pull any of these forward once Phase 1–2 is solid. Let me know if you'd rather I collapse the scope further (e.g., landing + dashboard + project detail only, skipping the mapping wizard for now) or expand it (include the chat page in this pass).
