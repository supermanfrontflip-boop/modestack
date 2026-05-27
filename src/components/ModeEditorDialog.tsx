import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { makeId } from "@/lib/vault-store";
import type { Mode, Intensity } from "@/lib/modes-data";

const blank: Mode = {
  id: "",
  mode: "",
  category: "",
  purpose: "",
  bestFor: "",
  avoidWhen: "",
  stackWith: "",
  exitPhrase: "Exit.",
  intensity: "Medium",
  exampleUse: "",
  fullPrompt: "",
  triggers: [],
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Mode;
  onSave: (mode: Mode) => void;
}

export function ModeEditorDialog({ open, onOpenChange, initial, onSave }: Props) {
  const [form, setForm] = useState<Mode>(initial ?? blank);
  const [triggersText, setTriggersText] = useState((initial?.triggers ?? []).join(", "));

  useEffect(() => {
    setForm(initial ?? blank);
    setTriggersText((initial?.triggers ?? []).join(", "));
  }, [initial, open]);

  const update = <K extends keyof Mode>(key: K, value: Mode[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => {
    if (!form.mode.trim()) {
      toast.error("Mode name is required");
      return;
    }
    const triggers = triggersText
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    const toSave: Mode = {
      ...form,
      id: form.id || makeId(form.mode),
      triggers,
    };
    onSave(toSave);
    onOpenChange(false);
    toast.success(initial ? "Mode updated" : "Mode added");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="mono tracking-widest text-primary">
            {initial ? "EDIT MODE" : "NEW MODE"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Field label="Mode">
            <Input value={form.mode} onChange={(e) => update("mode", e.target.value)} placeholder="e.g. Falcon Mode" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <Input value={form.category} onChange={(e) => update("category", e.target.value)} />
            </Field>
            <Field label="Intensity">
              <Select value={form.intensity} onValueChange={(v) => update("intensity", v as Intensity)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Low", "Medium", "High", "Extreme"].map((i) => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Purpose">
            <Textarea rows={2} value={form.purpose} onChange={(e) => update("purpose", e.target.value)} />
          </Field>
          <Field label="Best For">
            <Textarea rows={2} value={form.bestFor} onChange={(e) => update("bestFor", e.target.value)} />
          </Field>
          <Field label="Avoid When">
            <Textarea rows={2} value={form.avoidWhen} onChange={(e) => update("avoidWhen", e.target.value)} />
          </Field>
          <Field label="Stack With">
            <Input value={form.stackWith} onChange={(e) => update("stackWith", e.target.value)} placeholder="Owl Mode, Clear Mode" />
          </Field>
          <Field label="Exit Phrase">
            <Input value={form.exitPhrase} onChange={(e) => update("exitPhrase", e.target.value)} />
          </Field>
          <Field label="Example Use">
            <Textarea rows={2} value={form.exampleUse} onChange={(e) => update("exampleUse", e.target.value)} />
          </Field>
          <Field label="Full Prompt">
            <Textarea rows={4} value={form.fullPrompt} onChange={(e) => update("fullPrompt", e.target.value)} />
          </Field>
          <Field label="Triggers (comma separated keywords)">
            <Input value={triggersText} onChange={(e) => setTriggersText(e.target.value)} placeholder="research, analyze, compare" />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} className="mono tracking-wider">SAVE</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] mono tracking-widest text-muted-foreground">{label.toUpperCase()}</Label>
      {children}
    </div>
  );
}
