import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { makeId } from "@/lib/vault-store";
import { normalizeMode, type Mode, type Intensity } from "@/lib/modes-data";

const blank: Mode = normalizeMode({ id: "", mode: "" });

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Mode;
  onSave: (mode: Mode) => void;
}

export function ModeEditorDialog({ open, onOpenChange, initial, onSave }: Props) {
  const [form, setForm] = useState<Mode>(initial ? normalizeMode(initial) : blank);
  const [triggersText, setTriggersText] = useState((initial?.triggers ?? []).join(", "));

  useEffect(() => {
    setForm(initial ? normalizeMode(initial) : blank);
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
    const toSave: Mode = normalizeMode({
      ...form,
      id: form.id || makeId(form.mode),
      triggers,
    });
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
            <Field label="Subcategory">
              <Input
                value={form.subcategory ?? ""}
                onChange={(e) => update("subcategory", e.target.value)}
                placeholder="optional"
              />
            </Field>
          </div>
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
          <Field label="Purpose">
            <Textarea rows={2} value={form.purpose} onChange={(e) => update("purpose", e.target.value)} />
          </Field>

          <Accordion type="multiple" className="border border-border rounded-md px-3">
            <Section label="Core Objective">
              <Textarea
                rows={2}
                value={form.coreObjective ?? ""}
                onChange={(e) => update("coreObjective", e.target.value)}
                placeholder="One sentence: what this mode is trying to accomplish."
              />
            </Section>
            <Section label="Core Principles">
              <Textarea
                rows={4}
                value={form.corePrinciples ?? ""}
                onChange={(e) => update("corePrinciples", e.target.value)}
                placeholder="One principle per line."
              />
            </Section>
            <Section label="Failure Modes">
              <Textarea
                rows={4}
                value={form.failureModes ?? ""}
                onChange={(e) => update("failureModes", e.target.value)}
                placeholder="Known ways this mode fails or is misused. One per line."
              />
            </Section>
            <Section label="Integrity Checks" last>
              <Textarea
                rows={4}
                value={form.integrityChecks ?? ""}
                onChange={(e) => update("integrityChecks", e.target.value)}
                placeholder="Self-checks the mode runs before delivering output. One per line."
              />
            </Section>
          </Accordion>

          <Field label="Best For">
            <Textarea rows={2} value={form.bestFor} onChange={(e) => update("bestFor", e.target.value)} />
          </Field>
          <Field label="Avoid When">
            <Textarea rows={2} value={form.avoidWhen} onChange={(e) => update("avoidWhen", e.target.value)} />
          </Field>
          <Field label="Stack With">
            <Input value={form.stackWith} onChange={(e) => update("stackWith", e.target.value)} placeholder="Owl Mode, Clear Mode" />
          </Field>
          <Field label="Attributes (future modifiers)">
            <Textarea
              rows={2}
              value={form.attributes ?? ""}
              onChange={(e) => update("attributes", e.target.value)}
              placeholder="Reserved for future modifier system. e.g. tone:formal, risk:high"
            />
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

function Section({
  label,
  children,
  last,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <AccordionItem value={label} className={last ? "border-b-0" : ""}>
      <AccordionTrigger className="text-[10px] mono tracking-widest text-muted-foreground hover:no-underline py-2">
        {label.toUpperCase()}
      </AccordionTrigger>
      <AccordionContent className="pb-3">{children}</AccordionContent>
    </AccordionItem>
  );
}
