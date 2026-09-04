# Make the intelligence visible — motion & presentation pass

One note before we start: in this project the data still comes from the in-app
store (`src/lib/store.ts`) — there is no FastAPI client in the codebase. So every
count, stage, confidence value and QA result below is wired to the state the app
already holds, and anything the store doesn't have is simply omitted rather than
invented. When the real API is wired in, these surfaces read from it unchanged.

`framer-motion` is already installed, so no new dependency is needed.

## 1. Visual + motion foundation

- `src/lib/motion.ts` (new): spring presets, durations (micro 150–250ms, reveal
  300–500ms), stagger helper capped at 12 children, and a reduced-motion flag.
  Every component imports from here — no ad-hoc numbers.
- `src/styles.css`: add OKLCH tokens `--ai-idle / --ai-active / --ai-confident /
  --ai-uncertain / --ai-blocked` and `--run-placeholder / --run-instruction /
  --run-mergefield` for both themes, mapped in `@theme inline`. Custom
  `::selection` (app chrome) plus a distinct selection colour scoped to the
  template editor. A global `prefers-reduced-motion` block collapses all motion
  to opacity-only.
- `src/components/atmosphere.tsx` (new), rendered once inside the app shell
  behind content: 3 blurred radial gradients drifting on a ~25s transform-only
  loop, plus a 2–3% grain overlay. Pauses on `document.hidden`.
- Elevation pass: layered soft shadows + 1px low-alpha border utilities;
  backdrop-blur limited to overlays and floating toolbars. Focus rings and
  skeletons switch to the intelligence ramp.
- Route transitions: 200ms fade + 8px rise wrapper in `src/routes/_app.tsx`.

## 2. Compile reveal (Stage 1, template import)

In `src/components/template-conversion-wizard.tsx` (detect step) and the project
Template stage: replace the plain loading state with a staged reveal listing the
six real pipeline stages, each sliding in with a check that draws. Completion is
driven by the actual async detection promise; if it resolves early the remaining
stages flush at ≤120ms each, total capped at 2.5s. Behind the list, a wireframe
"document scan" of the actual paragraph blocks with a scan-line sweep, blocks
lighting up as they're classified. On completion the real detected counts
(fields, conditions, blocks, MERGEFIELDs) spring-count from 0, and the skeleton
cross-fades to content with no layout shift. When detection used the rule-based
path, a green "Rule-based compile — no model call" badge replaces the model badge.

## 3. Template X-ray

New `src/components/template-xray.tsx` used by the template preview: a toggle
that staggers coloured overlays (20ms apart, ~400ms glow settle) onto classified
runs, one scan-line sweep on activation, a glass hover tooltip with field name /
type / governing condition, and a legend of live counts whose chips filter by
dimming everything else.

## 4. Mapping agent (Document Mapping screen)

In `src/routes/_app.projects.$id.mapping.$draftId.tsx`:
- Agent trace panel streaming the four real loop steps while proposals load,
  same request-driven/capped rule as §2.
- SVG connectors from each field to its matched column, path-length draw,
  staggered 40ms; weight/style/colour encode the existing confidence band
  (auto-accept solid confident, confirm solid medium, review dashed pulsing
  uncertain, blocked thick static).
- Confidence badges count up while a radial progress ring fills.
- Override: old connector detaches and fades, new draws in over 200ms, with an
  inline note when the mapping memory previously rejected that column.
- Unmatched values shake once then hold a slow pulse until acknowledged.

## 5. Generation — canary gate and batch stream

In the project Drafts/Generation stage: three canary cards flipping
Rendering → Verifying → Passed/Failed with each QA check ticking in
individually, then a gate graphic animating open before the batch. Batch rows
stream in as they complete with spring progress, a throughput counter only if
timing data exists, failures sliding in with a vertically drawing red border and
no auto-dismiss, and a "0 model calls · deterministic" badge on the header.
Copy stays "Rendering / Verifying / QA".

## 6. Enterprise surfaces

- Lineage toggle on generated documents: staggered connector draws from each
  value back to its source cell and from each block to its deciding condition.
- Audit log: timeline with a drawing spine, grouped by actor, hash-chained
  entry appearance.
- Always-visible model boundary chip (provider · residency · zero-retention) in
  the app shell header, pulsing during an active call.
- Blocked documents: download button shows a lock visibly engaging and names the
  failing check.
- Analytics: Recharts lines draw on mount, bars grow from baseline, figures tick
  up, 60ms stagger.

## 7. Editor micro-interactions

Floating glass bubble toolbar on selection in the TipTap template editor (fade +
4px rise, 150ms, repositions on scroll, Escape/outside-click dismiss) exposing
existing token actions; token chips lift 1px on hover and scale-in from 0.9 on
insert; a ⌘K command palette (cmdk, already installed) over existing routes and
actions with blur-in backdrop, spring scale from 0.96, 20ms result stagger.

## Constraints honoured

No API/store/route/prop shape changes, no new backend logic, no invented values,
no new localStorage, transform/opacity-only animation, and nothing that outlives
a real request.
