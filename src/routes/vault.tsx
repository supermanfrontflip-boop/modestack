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
  const { modes, upsertMode, deleteMode, resetModes } = useModes();
  const [q, setQ] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Mode | undefined>();

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
        <div className="text-[10px] mono tracking-widest text-muted-foreground">
          {filtered.length} / {modes.length} MODES
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
                <Row k="Stack with" v={m.stackWith} />
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
