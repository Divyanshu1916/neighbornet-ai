import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, AlertTriangle, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  updateIssueStatus,
  deleteIssue,
  isResolvedStatus,
  ISSUE_STATUSES,
  type Issue,
  type IssueStatus,
} from "@/lib/issues";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/auth-context";
import { isAdmin } from "@/lib/admin";
import { Button } from "@/components/ui/button";

function statusClass(s: Issue["status"]) {
  if (isResolvedStatus(s)) return "bg-success/15 border border-success/30 text-[oklch(0.35_0.15_155)]";
  switch (s) {
    case "Pending": return "bg-warning/15 border border-warning/30 text-[oklch(0.45_0.15_60)]";
    case "Verified": return "bg-primary/10 border border-primary/30 text-primary";
    case "Assigned": return "bg-info/15 border border-info/30 text-[oklch(0.4_0.16_240)]";
    case "In Progress": return "bg-info/15 border border-info/30 text-[oklch(0.4_0.16_240)]";
    default: return "bg-muted border border-border text-muted-foreground";
  }
}
function urgencyClass(u: Issue["urgency"]) {
  switch (u) {
    case "High": return "bg-destructive/10 text-destructive border border-destructive/20";
    case "Medium": return "bg-warning/15 text-[oklch(0.45_0.15_60)] border border-warning/30";
    case "Low": return "bg-muted text-muted-foreground border border-border";
  }
}

function publicReporterName(issue: Issue): string {
  if (issue.userName) return issue.userName;
  if (issue.userEmail) {
    const local = issue.userEmail.split("@")[0];
    // mask: keep first 2 chars
    if (local.length <= 2) return `${local}•••`;
    return `${local.slice(0, 2)}${"•".repeat(Math.min(4, local.length - 2))}`;
  }
  return "Community member";
}

export function IssueCard({ issue, index = 0 }: { issue: Issue; index?: number }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const admin = isAdmin(user);
  const isOwner = !!user && (
    (issue.userId && user.uid === issue.userId) ||
    (!!issue.userEmail && user.email?.toLowerCase() === issue.userEmail.toLowerCase())
  );
  const canDelete = admin || (isOwner && issue.status === "Pending");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const statusMutation = useMutation({
    mutationFn: (status: IssueStatus) => updateIssueStatus(issue.id, status),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["issues"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Failed to update status"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteIssue(issue.id),
    onSuccess: () => {
      toast.success("Report deleted");
      qc.invalidateQueries({ queryKey: ["issues"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Failed to delete"),
  });

  // Public reporter label hides PII. Admin sees full email.
  const reporterLabel = admin
    ? (issue.userName ?? issue.userEmail)
    : publicReporterName(issue);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
    >
      <Card className="group flex h-full flex-col gap-4 overflow-hidden rounded-2xl border-border/70 bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card">
        {issue.imageURL && (
          <div className="-mx-5 -mt-5 overflow-hidden border-b border-border/60 bg-muted">
            <img
              src={issue.imageURL}
              alt={issue.title}
              loading="lazy"
              className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>
        )}
        <div className="flex items-start justify-between gap-3">
          <div>
            <Badge variant="outline" className="rounded-full text-xs">{issue.category}</Badge>
            <h3 className="mt-2 font-display text-lg font-semibold leading-tight">{issue.title}</h3>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(issue.status)}`}>
            {issue.status}
          </span>
        </div>

        <p className="line-clamp-3 text-sm text-muted-foreground">{issue.description}</p>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{issue.location}</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{issue.createdAt.toLocaleDateString()}</span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${urgencyClass(issue.urgency)}`}>
            <AlertTriangle className="h-3 w-3" /> {issue.urgency}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3 text-xs">
          <div className="flex flex-col">
            <span className="text-muted-foreground">Reported by</span>
            <span className="font-medium">{reporterLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            {admin ? (
              <Select
                value={ISSUE_STATUSES.includes(issue.status) ? issue.status : "Pending"}
                onValueChange={(v) => statusMutation.mutate(v as IssueStatus)}
                disabled={statusMutation.isPending}
              >
                <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ISSUE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : null}
            {canDelete && (
              <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    aria-label="Delete report"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this report?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {admin
                        ? "This will permanently delete the report."
                        : "You can only delete your own pending reports. This cannot be undone."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
