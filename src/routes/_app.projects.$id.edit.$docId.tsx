import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  Minus,
  Undo2,
  Redo2,
  ChevronRight,
  CheckCircle2,
  ArrowLeft,
  Save,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/projects/$id/edit/$docId")({
  head: ({ params }) => ({
    meta: [
      { title: `Edit document — DocuMind AI` },
      { name: "description", content: "Rich document editor with block formatting and undo/redo for reviewing AI-generated drafts before approval." },
      { property: "og:title", content: "Edit generated draft — DocuMind AI" },
      { property: "og:description", content: "Refine AI-generated drafts with rich formatting before approval." },
    ],
  }),
  loader: ({ params }) => {
    const proj = useStore.getState().getProject(params.id);
    const doc = proj?.generated.find((g) => g.id === params.docId);
    if (!proj || !doc) throw notFound();
    return null;
  },
  component: DocEditor,
});

const DEFAULT_HTML = `
<h1>Generated Draft</h1>
<p>This draft was produced by <strong>DocuMind AI</strong> from your mapped source data. Review, edit, and approve when ready.</p>
<h2>Summary</h2>
<p>Replace this section with the executive summary. Use <em>italics</em> for emphasis and <strong>bold</strong> for key terms.</p>
<h2>Details</h2>
<ul><li>Point one from your source data</li><li>Point two with supporting evidence</li><li>Point three for context</li></ul>
<blockquote>Any relevant citation or callout goes here.</blockquote>
<h2>Next steps</h2>
<ol><li>Verify data accuracy</li><li>Adjust tone and terminology</li><li>Approve for downstream workflow</li></ol>
`;

function DocEditor() {
  const { id, docId } = Route.useParams();
  const navigate = useNavigate();
  const project = useStore((s) => s.projects.find((p) => p.id === id))!;
  const doc = project.generated.find((g) => g.id === docId)!;
  const storedContent = useStore((s) => s.docContent[docId]);
  const approved = useStore((s) => !!s.docApproved[docId]);
  const setDocContent = useStore((s) => s.setDocContent);
  const approveDoc = useStore((s) => s.approveDoc);

  const initialContent = useMemo(() => storedContent ?? DEFAULT_HTML, [storedContent]);
  const [dirty, setDirty] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: "Start writing…" }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          "prose-editor min-h-[60vh] focus:outline-none max-w-none text-foreground",
      },
    },
    onUpdate: () => setDirty(true),
  });

  useEffect(() => {
    return () => editor?.destroy();
  }, [editor]);

  if (!editor) return null;

  const save = () => {
    setDocContent(docId, editor.getHTML());
    setDirty(false);
    toast.success("Draft saved");
  };

  const approve = () => {
    setDocContent(docId, editor.getHTML());
    approveDoc(docId, true);
    setDirty(false);
    toast.success("Draft approved");
  };

  const unapprove = () => {
    approveDoc(docId, false);
    toast("Approval revoked");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="border-b border-border bg-surface/50 backdrop-blur px-6 py-3 flex items-center gap-4">
        <button
          onClick={() => navigate({ to: "/projects/$id", params: { id } })}
          className="h-8 w-8 rounded-lg border border-border hover:bg-accent flex items-center justify-center"
          aria-label="Back to project"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="text-sm text-muted-foreground flex items-center gap-2 min-w-0">
          <Link to="/dashboard" className="hover:text-foreground">Projects</Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <Link to="/projects/$id" params={{ id }} className="hover:text-foreground truncate">{project.name}</Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="text-foreground truncate">{doc.filename}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {approved ? (
            <span className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md bg-success/15 text-success text-xs font-medium border border-success/30">
              <CheckCircle2 className="h-3.5 w-3.5" /> Approved
            </span>
          ) : dirty ? (
            <span className="text-xs text-warning">Unsaved changes</span>
          ) : (
            <span className="text-xs text-muted-foreground">All changes saved</span>
          )}
          <Button variant="outline" size="sm" onClick={save} disabled={!dirty}>
            <Save className="h-4 w-4 mr-1.5" /> Save
          </Button>
          {approved ? (
            <Button variant="outline" size="sm" onClick={unapprove}>Revoke approval</Button>
          ) : (
            <Button size="sm" onClick={approve} className="bg-gradient-brand">
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Approve
            </Button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar editor={editor} />

      {/* Editor canvas */}
      <div className="flex-1 overflow-auto bg-background">
        <div className="max-w-3xl mx-auto my-8 rounded-xl border border-border bg-surface shadow-sm">
          <div className="px-10 py-12">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {/* Local editor styles */}
      <style>{`
        .prose-editor h1 { font-size: 2rem; font-weight: 700; line-height: 1.2; margin: 1rem 0 0.75rem; letter-spacing: -0.02em; }
        .prose-editor h2 { font-size: 1.5rem; font-weight: 600; line-height: 1.3; margin: 1.25rem 0 0.5rem; letter-spacing: -0.01em; }
        .prose-editor h3 { font-size: 1.2rem; font-weight: 600; margin: 1rem 0 0.4rem; }
        .prose-editor p  { line-height: 1.7; margin: 0.5rem 0; }
        .prose-editor ul, .prose-editor ol { padding-left: 1.4rem; margin: 0.5rem 0; }
        .prose-editor ul { list-style: disc; }
        .prose-editor ol { list-style: decimal; }
        .prose-editor li { margin: 0.2rem 0; line-height: 1.6; }
        .prose-editor blockquote { border-left: 3px solid var(--color-brand); padding: 0.25rem 0 0.25rem 1rem; color: var(--color-muted-foreground); margin: 0.75rem 0; font-style: italic; }
        .prose-editor pre { background: var(--color-surface-elevated); border: 1px solid var(--color-border); border-radius: 0.5rem; padding: 0.75rem 1rem; font-family: var(--font-mono); font-size: 0.85rem; overflow-x: auto; margin: 0.75rem 0; }
        .prose-editor code { background: var(--color-surface-elevated); padding: 0.1rem 0.35rem; border-radius: 4px; font-family: var(--font-mono); font-size: 0.85em; }
        .prose-editor pre code { background: transparent; padding: 0; }
        .prose-editor hr { border: none; border-top: 1px solid var(--color-border); margin: 1.25rem 0; }
        .prose-editor strong { font-weight: 700; }
        .prose-editor em { font-style: italic; }
        .prose-editor u { text-decoration: underline; }
        .prose-editor s { text-decoration: line-through; }
        .prose-editor p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: var(--color-muted-foreground);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const btn = (opts: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    icon: React.ReactNode;
    label: string;
  }) => (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={opts.onClick}
      disabled={opts.disabled}
      title={opts.label}
      aria-label={opts.label}
      aria-pressed={opts.active}
      className={cn(
        "h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:hover:bg-transparent",
        opts.active && "bg-brand/15 text-brand hover:bg-brand/20 hover:text-brand",
      )}
    >
      {opts.icon}
    </button>
  );

  const sep = <div className="w-px h-5 bg-border mx-1" />;

  return (
    <div className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur px-4 py-1.5 flex items-center flex-wrap gap-0.5">
      {btn({
        onClick: () => editor.chain().focus().undo().run(),
        disabled: !editor.can().undo(),
        icon: <Undo2 className="h-4 w-4" />,
        label: "Undo (⌘Z)",
      })}
      {btn({
        onClick: () => editor.chain().focus().redo().run(),
        disabled: !editor.can().redo(),
        icon: <Redo2 className="h-4 w-4" />,
        label: "Redo (⌘⇧Z)",
      })}
      {sep}
      {btn({
        onClick: () => editor.chain().focus().setParagraph().run(),
        active: editor.isActive("paragraph"),
        icon: <Type className="h-4 w-4" />,
        label: "Paragraph",
      })}
      {btn({
        onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        active: editor.isActive("heading", { level: 1 }),
        icon: <Heading1 className="h-4 w-4" />,
        label: "Heading 1",
      })}
      {btn({
        onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        active: editor.isActive("heading", { level: 2 }),
        icon: <Heading2 className="h-4 w-4" />,
        label: "Heading 2",
      })}
      {btn({
        onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        active: editor.isActive("heading", { level: 3 }),
        icon: <Heading3 className="h-4 w-4" />,
        label: "Heading 3",
      })}
      {sep}
      {btn({
        onClick: () => editor.chain().focus().toggleBold().run(),
        active: editor.isActive("bold"),
        icon: <Bold className="h-4 w-4" />,
        label: "Bold (⌘B)",
      })}
      {btn({
        onClick: () => editor.chain().focus().toggleItalic().run(),
        active: editor.isActive("italic"),
        icon: <Italic className="h-4 w-4" />,
        label: "Italic (⌘I)",
      })}
      {btn({
        onClick: () => editor.chain().focus().toggleUnderline().run(),
        active: editor.isActive("underline"),
        icon: <UnderlineIcon className="h-4 w-4" />,
        label: "Underline (⌘U)",
      })}
      {btn({
        onClick: () => editor.chain().focus().toggleStrike().run(),
        active: editor.isActive("strike"),
        icon: <Strikethrough className="h-4 w-4" />,
        label: "Strikethrough",
      })}
      {sep}
      {btn({
        onClick: () => editor.chain().focus().toggleBulletList().run(),
        active: editor.isActive("bulletList"),
        icon: <List className="h-4 w-4" />,
        label: "Bullet list",
      })}
      {btn({
        onClick: () => editor.chain().focus().toggleOrderedList().run(),
        active: editor.isActive("orderedList"),
        icon: <ListOrdered className="h-4 w-4" />,
        label: "Numbered list",
      })}
      {btn({
        onClick: () => editor.chain().focus().toggleBlockquote().run(),
        active: editor.isActive("blockquote"),
        icon: <Quote className="h-4 w-4" />,
        label: "Quote",
      })}
      {btn({
        onClick: () => editor.chain().focus().toggleCodeBlock().run(),
        active: editor.isActive("codeBlock"),
        icon: <Code2 className="h-4 w-4" />,
        label: "Code block",
      })}
      {btn({
        onClick: () => editor.chain().focus().setHorizontalRule().run(),
        icon: <Minus className="h-4 w-4" />,
        label: "Divider",
      })}
    </div>
  );
}
