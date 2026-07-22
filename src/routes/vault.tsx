import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useModes } from "@/lib/vault-store";
import { CopyButton } from "@/components/CopyButton";
import { CategoryTag, IntensityPill } from "@/components/ModeBadge";
import { ModeEditorDialog } from "@/components/ModeEditorDialog";
import type { Mode } from "@/lib/modes-data";
import { Download, Pencil, Plus, RotateCcw, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { csvToModes, downloadCSV, modesToCSV } from "@/lib/csv";

export const Route = createFileRoute("/vault")({
  head: () => ({
    meta: [
      { title: "Mode Vault — Prompt Command Center" },
      { name: "description", content: "Browse, search, add, edit, and delete prompt modes." },
    ],
  }),
  component: VaultPage,
});

function VaultPage() {
  const { modes, hydrated, upsertMode, deleteMode, resetModes, replaceModes, mergeModes } = useModes();
  const [q, setQ] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Mode | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<{ modes: Mode[]; errors: string[] } | null>(null);
  const [csvTextOpen, setCsvTextOpen] = useState(false);
  const [exportPreview, setExportPreview] = useState<{
    filename: string;
    csv: string;
    headers: string[];
    firstRow: string[] | null;
    rowCount: number;
    columnCount: number;
  } | null>(null);

  const onExport = () => {
    try {
      if (modes.length === 0) {
        toast.error("Export failed", { description: "Vault is empty — nothing to export." });
        return;
      }
      const csv = modesToCSV(modes);
      const lines = csv.split("\n");
      const headers = lines[0].split(",");
      const firstDataRow = lines[1] ? lines[1].split(",") : null;
      const date = new Date().toISOString().slice(0, 10);
      const filename = `prompt-vault-${date}.csv`;
      setExportPreview({
        filename,
        csv,
        headers,
        firstRow: firstDataRow,
        rowCount: modes.length,
        columnCount: headers.length,
      });
    } catch (err) {
      toast.error("Export failed", {
        description: err instanceof Error ? err.message : "Unknown error generating CSV.",
      });
    }
  };

  const confirmExport = async () => {
    if (!exportPreview) return;
    try {
      await downloadCSV(exportPreview.filename, exportPreview.csv);
      toast.success("Export successful", {
        description: `${exportPreview.filename} — ${exportPreview.rowCount} rows × ${exportPreview.columnCount} columns`,
      });
      setExportPreview(null);
    } catch (err) {
      toast.error("Export failed", {
        description: err instanceof Error ? err.message : "Browser blocked the download.",
      });
    }
  };

  const onImportClick = () => fileInputRef.current?.click();

  const onFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const result = csvToModes(text);
      if (result.modes.length === 0) {
        toast.error(result.errors[0] || "No valid modes found in CSV");
        return;
      }
      setPendingImport(result);
    } catch (err) {
      toast.error("Could not read file");
    }
  };

  const applyImport = (mode: "merge" | "replace") => {
    if (!pendingImport) return;
    if (mode === "replace") {
      replaceModes(pendingImport.modes);
      toast.success(`Replaced vault with ${pendingImport.modes.length} modes`);
    } else {
      const { added, updated } = mergeModes(pendingImport.modes);
      toast.success(`Imported ${added} new, updated ${updated}`);
    }
    setPendingImport(null);
  };

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return modes;
    return modes.filter((m) =>
      [m.mode, m.category, m.purpose, m.bestFor, m.exampleUse, ...m.triggers]
        .join(" ")
        .toLowerCase()
        .includes(t),
    );
  }, [modes, q]);

  const openNew = () => {
    setEditing(undefined);
    setEditorOpen(true);
  };
  const openEdit = (m: Mode) => {
    setEditing(m);
    setEditorOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="hud-panel p-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search modes, categories, triggers…"
            className="pl-8 bg-input/60"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={openNew} className="flex-1 mono tracking-wider">
            <Plus className="h-4 w-4 mr-1.5" /> NEW MODE
          </Button>
          <Button variant="outline" size="icon" onClick={onImportClick} title="Import CSV">
            <Upload className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={onExport} title="Export CSV">
            <Download className="h-4 w-4" />
          </Button>
          <Button
  variant="outline"
  size="sm"
  onClick={() => setCsvTextOpen(true)}
  className="mono tracking-wider"
>
  SHOW CSV
</Button>

<AlertDialog>
  <AlertDialogTrigger asChild>
  <Button variant="outline" size="icon" title="Reset to seed">
    <RotateCcw className="h-4 w-4" />
  </Button>
</AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset vault to defaults?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will restore the original seeded modes and remove any custom ones.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => { resetModes(); toast.success("Vault reset"); }}>
                  Reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={onFileChosen}
        />
        <div className="text-[10px] mono tracking-widest text-muted-foreground">
          {hydrated ? `${filtered.length} / ${modes.length} MODES` : "LOADING VAULT…"}
        </div>

      </div>

      <Accordion type="multiple" className="space-y-2">
        {filtered.map((m) => (
          <AccordionItem
            key={m.id}
            value={m.id}
            className="hud-panel border-border px-3 [&[data-state=open]]:border-primary/40"
          >
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="mono text-sm text-foreground truncate">{m.mode}</span>
                <div className="flex items-center gap-1 ml-auto pr-2">
                  <CategoryTag category={m.category} />
                  <IntensityPill intensity={m.intensity} />
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4">
              <p className="text-sm text-foreground/85">{m.purpose}</p>
              <div className="grid grid-cols-1 gap-1.5 text-xs">
                <Row k="Best for" v={m.bestFor} />
                <Row k="Avoid when" v={m.avoidWhen} />
                <Row k="Stack with" v={m.layers} />
                <Row k="Exit" v={m.exitPhrase} mono />
                <Row k="Example" v={m.exampleUse} />
              </div>
              <div>
                <div className="text-[10px] mono tracking-widest text-muted-foreground mb-1">
                  FULL PROMPT
                </div>
                <pre className="whitespace-pre-wrap break-words text-xs font-mono bg-background/60 border border-border rounded-md p-2.5 text-foreground/90">
                  {m.fullPrompt}
                </pre>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <CopyButton value={m.fullPrompt} label="Prompt" />
                <Button variant="outline" size="sm" onClick={() => openEdit(m)} className="mono tracking-wider">
                  <Pencil className="h-3.5 w-3.5 mr-1.5" /> EDIT
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="mono tracking-wider text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" /> DELETE
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {m.mode}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes the mode from your vault. You can reset to defaults to restore seeded modes.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => { deleteMode(m.id); toast.success("Mode deleted"); }}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
        {filtered.length === 0 && (
          <div className="hud-panel p-6 text-center text-sm text-muted-foreground">
            No modes match your search.
          </div>
        )}
      </Accordion>

      <ModeEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        initial={editing}
        onSave={upsertMode}
      />

      <Dialog open={!!pendingImport} onOpenChange={(o) => !o && setPendingImport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="mono tracking-widest text-primary">IMPORT CSV</DialogTitle>
            <DialogDescription>
              Found <span className="mono text-foreground">{pendingImport?.modes.length ?? 0}</span> mode(s) in the file.
              Choose how to apply them.
            </DialogDescription>
          </DialogHeader>
          {pendingImport && pendingImport.errors.length > 0 && (
            <div className="text-xs text-destructive space-y-1 max-h-32 overflow-auto">
              {pendingImport.errors.map((e, i) => <div key={i}>• {e}</div>)}
            </div>
          )}
          <div className="text-xs text-muted-foreground space-y-1">
            <div><span className="mono text-foreground">Merge</span> — add new and update existing by id.</div>
            <div><span className="mono text-foreground">Replace</span> — overwrite your entire vault.</div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setPendingImport(null)}>Cancel</Button>
            <Button variant="outline" onClick={() => applyImport("replace")} className="mono tracking-wider">
              REPLACE
            </Button>
            <Button onClick={() => applyImport("merge")} className="mono tracking-wider">
              MERGE
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
<Dialog open={csvTextOpen} onOpenChange={setCsvTextOpen}>
  <DialogContent className="max-w-xl">
    <DialogHeader>
      <DialogTitle className="mono tracking-widest text-primary">
        VAULT CSV TEXT
      </DialogTitle>
      <DialogDescription>
        Select all of this text manually and copy it if download is blocked.
      </DialogDescription>
    </DialogHeader>

    <textarea
      readOnly
      value={modesToCSV(modes)}
      className="w-full h-80 text-xs font-mono bg-background border border-border rounded-md p-2"
      onFocus={(e) => e.currentTarget.select()}
    />

    <DialogFooter>
      <Button onClick={() => setCsvTextOpen(false)}>Close</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
      <Dialog open={!!exportPreview} onOpenChange={(o) => !o && setExportPreview(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="mono tracking-widest text-primary">EXPORT PREVIEW</DialogTitle>
            <DialogDescription>Review the CSV before download.</DialogDescription>
          </DialogHeader>
          {exportPreview && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <Stat k="Rows" v={String(exportPreview.rowCount)} />
                <Stat k="Columns" v={String(exportPreview.columnCount)} />
                <Stat k="File" v={exportPreview.filename} mono />
              </div>
              <div>
                <div className="text-[10px] mono tracking-widest text-muted-foreground mb-1">
                  COLUMN HEADERS
                </div>
                <div className="flex flex-wrap gap-1">
                  {exportPreview.headers.map((h) => (
                    <span key={h} className="mono text-[10px] px-1.5 py-0.5 rounded bg-background/60 border border-border text-foreground/85">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] mono tracking-widest text-muted-foreground mb-1">
                  FIRST ROW
                </div>
                <div className="max-h-56 overflow-auto border border-border rounded-md bg-background/60">
                  {exportPreview.firstRow ? (
                    <table className="w-full text-[11px]">
                      <tbody>
                        {exportPreview.headers.map((h, i) => (
                          <tr key={h} className="border-b border-border/40 last:border-0">
                            <td className="mono text-muted-foreground px-2 py-1 align-top whitespace-nowrap">
                              {h}
                            </td>
                            <td className="px-2 py-1 text-foreground/85 break-all">
                              {exportPreview.firstRow![i] ?? ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-3 text-muted-foreground">No data rows.</div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setExportPreview(null)}>Cancel</Button>
            <Button onClick={confirmExport} className="mono tracking-wider">
              <Download className="h-4 w-4 mr-1.5" /> DOWNLOAD
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="hud-panel p-2">
      <div className="text-[9px] mono tracking-widest text-muted-foreground">{k.toUpperCase()}</div>
      <div className={`text-xs text-foreground ${mono ? "font-mono break-all" : ""}`}>{v}</div>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[88px_1fr] gap-2">
      <span className="text-[10px] mono tracking-widest text-muted-foreground self-start pt-0.5">
        {k.toUpperCase()}
      </span>
      <span className={`text-xs text-foreground/85 ${mono ? "font-mono" : ""}`}>{v}</span>
    </div>
  );
}
