import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Sparkles, FileText } from "lucide-react";
import { autoDetectTokens } from "./template-editor";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImport: (name: string, html: string) => void;
};

export function TemplateImportDialog({ open, onOpenChange, onImport }: Props) {
  const [tab, setTab] = useState<"upload" | "paste">("upload");
  const [name, setName] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileText, setFileText] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [autoDetect, setAutoDetect] = useState(true);

  const reset = () => {
    setName(""); setFileName(null); setFileText(""); setPastedText("");
    setTab("upload"); setAutoDetect(true);
  };

  const handleFile = async (f: File) => {
    setFileName(f.name);
    if (!name) setName(f.name.replace(/\.(docx?|txt|md|rtf)$/i, ""));
    // Read as text — .docx binary contents will be gibberish; user still gets
    // a name + can paste content in the second tab. For .txt/.md we get real text.
    try {
      const text = await f.text();
      // crude: strip non-printable if this was actually a binary file
      const printable = text.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ").replace(/\s{2,}/g, " ").trim();
      setFileText(printable.length > 40 ? printable : "");
    } catch {
      setFileText("");
    }
  };

  const submit = () => {
    const finalName = name.trim() || "Untitled template";
    const raw = tab === "upload" ? fileText : pastedText;
    if (!raw.trim()) {
      toast.error("Nothing to import — add some content first.");
      return;
    }
    const html = autoDetect && tab === "upload"
      ? autoDetectTokens(raw)
      : `<p>${raw.split(/\n\s*\n/).map((p) => p.replace(/\n/g, "<br/>")).join("</p><p>")}</p>`;
    onImport(finalName, html);
    toast.success(`Imported "${finalName}" — refine tokens in the editor`);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import existing template</DialogTitle>
          <DialogDescription>
            Bring in a .docx or paste raw text — we'll convert it into a token template you can refine.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Template name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Offer Letter — EU Standard" />
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="upload"><Upload className="h-4 w-4 mr-1.5" /> Upload .docx</TabsTrigger>
              <TabsTrigger value="paste"><FileText className="h-4 w-4 mr-1.5" /> Paste text</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-3 pt-3">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg py-10 cursor-pointer hover:border-brand/50 transition-colors">
                <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                <span className="text-sm font-medium">
                  {fileName ?? "Drop or select a .docx / .txt file"}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  We'll extract text and suggest tokens automatically
                </span>
                <input
                  type="file"
                  accept=".docx,.doc,.txt,.md,.rtf"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoDetect}
                  onChange={(e) => setAutoDetect(e.target.checked)}
                  className="rounded border-border"
                />
                <Sparkles className="h-3.5 w-3.5 text-brand" />
                Auto-detect placeholders like <code className="text-xs">{"{name}"}</code>, <code className="text-xs">[FIELD]</code>, <code className="text-xs">[AI: …]</code>
              </label>
              {fileText && (
                <div className="rounded-lg border border-border bg-surface p-3 max-h-32 overflow-auto text-xs text-muted-foreground whitespace-pre-wrap">
                  {fileText.slice(0, 400)}{fileText.length > 400 ? "…" : ""}
                </div>
              )}
            </TabsContent>

            <TabsContent value="paste" className="space-y-2 pt-3">
              <Label>Raw content</Label>
              <Textarea
                rows={10}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={`Dear {full_name},\n\nWe are pleased to offer you the position of [ROLE]…\n\n[AI: warm 2-sentence welcome]`}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Highlight spans in the editor after import to convert them into Source or Prompt tokens.
              </p>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} className="bg-gradient-brand text-white">Import & edit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
