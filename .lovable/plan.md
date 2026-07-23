
## Goal

Turn the Templates page from a static grid into a real template-authoring surface. Every template is built out of color-coded tokens the generator understands:

- **Black** — static text, taken verbatim
- **Blue** — Source Value, pulls from a mapped source field
- **Red** — LLM Prompt, replaced at generate-time by AI
- **Green** — Conditional (show/hide a block based on a rule)
- **Purple** — Repeat (loop a block over source rows, for tables/lists)

## Templates page (list + editor split)

`src/routes/_app.templates.tsx` becomes a two-pane layout:

- **Left rail** — searchable saved-templates list (existing dummy data, compact rows: name, category, version, updated). "+ New template" and "Import .docx" at the top.
- **Right pane** — the token editor for the selected template. Empty state prompts New or Import.

Category filter chips and KPI cards stay above the split.

## Token editor (WordPad-style)

New component `src/components/template-editor.tsx`, mounted inside the Templates route (not a separate URL).

Layout:

```text
┌ Toolbar ────────────────────────────────────────────────────┐
│ B  I  U  •  1.  H1 H2  |  [+ Static] [+ Source] [+ Prompt]  │
│                              [+ If] [+ Repeat]  |  Undo Redo│
├ Editable canvas (contentEditable, TipTap) ──────────────────┤
│  Dear <blue:full_name>,                                     │
│  We are pleased to offer you the position of                │
│  <blue:role> starting <blue:start_date>.                    │
│  <red: Write a warm 2-sentence welcome paragraph…>          │
│  <green if region=="EU"> GDPR clause … </green>             │
│  <purple foreach benefit in benefits> • {benefit} </purple> │
├ Legend + Inspector (right sidebar inside pane) ─────────────┤
│  Selected token: Source Value                               │
│    Field: [full_name ▾]   Fallback: [____]                  │
└─────────────────────────────────────────────────────────────┘
```

Details:
- Built on the existing TipTap stack. Each token type is a custom inline (or block, for If/Repeat) TipTap node with `data-token-type` and its own attributes.
- Token nodes render with the assigned color, a subtle rounded background, and a small type-glyph on the left ({}, ⚡, ⌥, ↻). Colors go through semantic tokens in `src/styles.css` (add `--token-source`, `--token-prompt`, `--token-conditional`, `--token-repeat`) so both themes look correct.
- Toolbar buttons insert a token at the caret. Clicking a token opens the right-side Inspector to edit its attributes (source field dropdown, prompt text, condition expression, loop variable + collection).
- Text formatting (bold/italic/underline, lists, H1–H3), undo/redo, keyboard shortcuts — reuse the setup from `_app.projects.$id.edit.$docId.tsx`.
- Live legend under the toolbar so users know what each color means.

## Import existing templates (both flows)

An **Import** button on the left rail opens a dialog with two tabs:

1. **Upload .docx** — file input, calls `document--parse_document` server-side, returns HTML + plain text. An "Auto-detect tokens" pass runs a lightweight heuristic (regex for `{placeholder}`, `[BRACKETED]`, `<<merge>>` patterns → Source Value; TODO/`[AI: …]` markers → Prompt) and then offers AI suggestions for the rest. User accepts/edits before saving.
2. **Paste text** — textarea; user pastes, then in the editor highlights a span and clicks a token button to convert it. No auto-detect.

Both paths land in the same token editor so the user can refine before saving.

## Data model (store)

Extend `src/lib/store.ts`:

```ts
type TokenType = "static" | "source" | "prompt" | "conditional" | "repeat";
type TemplateBlock = {
  id: string;
  content: string;                // token editor HTML (TipTap JSON serialized)
  updatedAt: string;
};
// add to Template: blocks?: TemplateBlock; sourceFields?: string[]
```

New store actions: `upsertTemplateContent(templateId, html)`, `createTemplate(name, category)`, `importTemplateFromText(name, category, html)`. Existing dummy templates gain a small default `blocks.content` so the editor isn't empty when opened.

## Out of scope for this pass

- Actually calling the LLM at generate-time (the mapping wizard already stubs generation; token-aware generation is a follow-up).
- Version history UI beyond the existing `version` string.
- Multi-user real-time editing.

## Technical notes

- Reuse `@tiptap/react` + `@tiptap/starter-kit` already installed. Add custom nodes via `Node.create({ name: "sourceToken", inline: true, atom: true, addAttributes: …, parseHTML: …, renderHTML: … })`.
- Persist content as HTML in the Zustand store (localStorage-backed) so it survives reloads like existing draft docs.
- No new routes — everything stays under `/templates`. Deep-linking a specific template can use a `?t=<id>` search param on the route.
- Keep all colors as CSS variables; never hardcode hex.
