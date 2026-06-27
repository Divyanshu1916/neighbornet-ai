import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

import { Protected } from "@/components/site/Protected";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { createIssue, type IssueCategory, type IssueUrgency } from "@/lib/issues";

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

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Garbage" as IssueCategory,
    location: "",
    urgency: "Medium" as IssueUrgency,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = schema.parse(form);
      await createIssue({
        ...parsed,
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
      const msg = e instanceof z.ZodError ? e.issues[0].message : e instanceof Error ? e.message : "Failed to submit";
      toast.error(msg);
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
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

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => navigate({ to: "/feed" })}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending} className="rounded-xl">
              <Send className="mr-2 h-4 w-4" />
              {mutation.isPending ? "Submitting…" : "Submit Report"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
