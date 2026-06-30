import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Send, Sparkles, Wand2, Upload, X, ImageIcon } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { classifyIssue } from "@/lib/classifier";

import { Protected } from "@/components/site/Protected";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { createIssue, type IssueCategory, type IssueUrgency } from "@/lib/issues";
import { uploadIssueImage, validateImage, ACCEPTED_IMAGE_TYPES } from "@/lib/upload";

export const Route = createFileRoute("/report")({
  head: () => ({ meta: [{ title: "Report an Issue — NeighborNet AI" }] }),
  component: () => (
    <Protected>
      <ReportPage />
    </Protected>
  ),
});

const categories: IssueCategory[] = ["Garbage", "Road Damage", "Water Leakage", "Street Light", "Public Safety", "Other"];
const urgencies: IssueUrgency[] = ["Low", "Medium", "High"];

const schema = z.object({
  title: z.string().trim().min(3, "Title is too short").max(120),
  description: z.string().trim().min(10, "Add more details").max(1000),
  category: z.enum(["Garbage", "Road Damage", "Water Leakage", "Street Light", "Public Safety", "Other"]),
  location: z.string().trim().min(2, "Location required").max(160),
  urgency: z.enum(["Low", "Medium", "High"]),
});

function ReportPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Garbage" as IssueCategory,
    location: "",
    urgency: "Medium" as IssueUrgency,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setImageFile(null);
      return;
    }
    const err = validateImage(file);
    if (err) {
      toast.error(err);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setImageFile(file);
  };

  const clearImage = () => {
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = schema.parse(form);
      let imageURL: string | null = null;
      if (imageFile) {
        setIsUploading(true);
        setUploadProgress(15);
        // Simulated progress (Supabase JS SDK doesn't expose upload progress yet)
        const tick = setInterval(() => {
          setUploadProgress((p) => (p < 85 ? p + 10 : p));
        }, 200);
        try {
          imageURL = await uploadIssueImage(
            imageFile,
            user!.email ?? "anonymous",
          );
          setUploadProgress(100);
        } finally {
          clearInterval(tick);
          setIsUploading(false);
        }
      }
      await createIssue({
        ...parsed,
        imageURL,
        userId: user!.uid,
        userEmail: user!.email ?? "anonymous@neighbor.net",
        userName: user!.displayName ?? undefined,
      });
    },
    onSuccess: () => {
      toast.success("Issue reported", { description: "Your community will be notified." });
      qc.invalidateQueries({ queryKey: ["issues"] });
      navigate({ to: "/feed" });
    },
    onError: (e: unknown) => {
      setIsUploading(false);
      setUploadProgress(0);
      const msg = e instanceof z.ZodError ? e.issues[0].message : e instanceof Error ? e.message : "Failed to submit";
      toast.error(msg);
    },
  });

  const isBusy = mutation.isPending || isUploading;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:max-w-3xl lg:py-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-10"
      >
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Report an Issue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Be specific — clearer reports get fixed faster.
        </p>

        <form
          className="mt-8 space-y-5"
          onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
        >
          <div className="space-y-2">
            <Label htmlFor="title">Issue Title</Label>
            <Input id="title" placeholder="e.g. Overflowing bin at Park Lane"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Issue Description</Label>
            <Textarea id="description" rows={5} placeholder="Describe what you saw, when, and how it's affecting the area."
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <AISuggestionPanel
            text={`${form.title} ${form.description}`}
            currentCategory={form.category}
            currentUrgency={form.urgency}
            onApply={(s) =>
              setForm((f) => ({
                ...f,
                category: s.category ?? f.category,
                urgency: s.urgency ?? f.urgency,
              }))
            }
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as IssueCategory })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Urgency</Label>
              <Select value={form.urgency} onValueChange={(v) => setForm({ ...form, urgency: v as IssueUrgency })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {urgencies.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" placeholder="Street, landmark, or neighborhood"
              value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">
              Photo <span className="text-xs font-normal text-muted-foreground">(optional, JPG/PNG/WebP, max 10 MB)</span>
            </Label>
            <input
              ref={fileInputRef}
              id="image"
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              className="sr-only"
              onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
            />
            {!imagePreview ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <ImageIcon className="h-6 w-6" />
                <span className="font-medium">Tap to upload an image</span>
                <span className="text-xs">JPG, PNG or WebP · up to 10 MB</span>
              </button>
            ) : (
              <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/30">
                <img
                  src={imagePreview}
                  alt="Selected preview"
                  className="max-h-72 w-full object-cover"
                />
                <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                  <span className="truncate text-muted-foreground">
                    {imageFile?.name} · {imageFile ? (imageFile.size / 1024 / 1024).toFixed(2) : 0} MB
                  </span>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isBusy}
                    >
                      <Upload className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={clearImage}
                      disabled={isBusy}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {isUploading && (
              <div className="space-y-1">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">Uploading image… {uploadProgress}%</p>
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse items-stretch gap-2 pt-2 sm:flex-row sm:items-center sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => navigate({ to: "/feed" })}>Cancel</Button>
            <Button type="submit" disabled={isBusy} className="rounded-xl">
              <Send className="mr-2 h-4 w-4" />
              {isUploading ? "Uploading…" : mutation.isPending ? "Submitting…" : "Submit Report"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function AISuggestionPanel({
  text,
  currentCategory,
  currentUrgency,
  onApply,
}: {
  text: string;
  currentCategory: IssueCategory;
  currentUrgency: IssueUrgency;
  onApply: (s: { category: IssueCategory | null; urgency: IssueUrgency | null }) => void;
}) {
  const suggestion = useMemo(() => classifyIssue(text), [text]);
  const hasAny = suggestion.category || suggestion.urgency;
  const needsApply =
    (suggestion.category && suggestion.category !== currentCategory) ||
    (suggestion.urgency && suggestion.urgency !== currentUrgency);

  return (
    <AnimatePresence>
      {hasAny && (
        <motion.div
          initial={{ opacity: 0, y: -6, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -6, height: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Sparkles className="h-4 w-4" /> Smart suggestions
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <SuggestionPill
                label="AI Suggested Category"
                value={suggestion.category}
                matched={suggestion.matchedCategoryKeyword}
              />
              <SuggestionPill
                label="AI Suggested Urgency"
                value={suggestion.urgency}
                matched={suggestion.matchedUrgencyKeyword}
              />
            </div>
            {needsApply && (
              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-lg border-primary/30 bg-card"
                  onClick={() => {
                    onApply({ category: suggestion.category, urgency: suggestion.urgency });
                    toast.success("AI suggestions applied");
                  }}
                >
                  <Wand2 className="mr-2 h-3.5 w-3.5" /> Apply suggestions
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SuggestionPill({
  label,
  value,
  matched,
}: {
  label: string;
  value: string | null;
  matched?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        <span className="font-display text-base font-semibold">
          {value ?? "—"}
        </span>
        {matched && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
            “{matched}”
          </span>
        )}
      </div>
    </div>
  );
}
