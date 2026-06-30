import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ListChecks, Clock, Loader2, CheckCircle2, Plus, Search, MapPin, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  listIssues, isResolvedStatus, updateIssueStatus, ISSUE_STATUSES,
  type Issue, type IssueStatus,
} from "@/lib/issues";
import { Protected } from "@/components/site/Protected";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IssueCard } from "@/components/site/IssueCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { isAdmin } from "@/lib/admin";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — NeighborNet AI" }] }),
  component: () => (
    <Protected>
      <DashboardPage />
    </Protected>
  ),
});

const CATEGORIES = ["Garbage", "Road Damage", "Water Leakage", "Street Light", "Public Safety", "Other"] as const;

function StatCard({
  label, value, icon: Icon, tone, delay,
}: { label: string; value: number; icon: typeof ListChecks; tone: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-2xl border border-border bg-card p-5 shadow-soft"
    >
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 font-display text-3xl font-bold">{value}</div>
    </motion.div>
  );
}

function DashboardPage() {
  const { data: issues = [], isLoading, error } = useQuery({
    queryKey: ["issues"],
    queryFn: listIssues,
  });

  const stats = {
    total: issues.length,
    pending: issues.filter((i: Issue) => i.status === "Pending").length,
    progress: issues.filter((i: Issue) => i.status === "In Progress" || i.status === "Verified" || i.status === "Assigned").length,
    solved: issues.filter((i: Issue) => isResolvedStatus(i.status)).length,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">A pulse of your community.</p>
        </div>
        <Link to="/report">
          <Button className="rounded-xl"><Plus className="mr-2 h-4 w-4" /> Report Issue</Button>
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : (
          <>
            <StatCard label="Total Issues" value={stats.total} icon={ListChecks} tone="bg-primary/10 text-primary" delay={0} />
            <StatCard label="Pending" value={stats.pending} icon={Clock} tone="bg-warning/15 text-[oklch(0.45_0.15_60)]" delay={0.05} />
            <StatCard label="In Progress" value={stats.progress} icon={Loader2} tone="bg-info/15 text-[oklch(0.4_0.16_240)]" delay={0.1} />
            <StatCard label="Solved" value={stats.solved} icon={CheckCircle2} tone="bg-success/15 text-[oklch(0.35_0.15_155)]" delay={0.15} />
          </>
        )}
      </div>

      {error && (
        <div className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Couldn't load issues: {error instanceof Error ? error.message : "Unknown error"}.
        </div>
      )}

      {/* Visual divider between Dashboard summary and Issues section */}
      <div className="my-12 border-t border-border" />

      <IssuesSection issues={issues} isLoading={isLoading} />
    </div>
  );
}

function IssuesSection({ issues, isLoading }: { issues: Issue[]; isLoading: boolean }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Issue | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return issues.filter((i) => {
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (categoryFilter !== "all" && i.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q)
      );
    });
  }, [issues, search, statusFilter, categoryFilter]);

  return (
    <section className="rounded-3xl bg-muted/30 p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Reported Issues</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Latest reports from the community. Search and filter to find what matters.
          </p>
        </div>
        <Badge variant="outline" className="rounded-full">{filtered.length} shown</Badge>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, description, or location"
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ISSUE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((i, idx) => (
              <div key={i.id} className="flex flex-col gap-2">
                <IssueCard issue={i} index={idx} />
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setSelected(i)}
                >
                  View Details
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <IssueDetailsDialog issue={selected} onClose={() => setSelected(null)} />
    </section>
  );
}

function IssueDetailsDialog({ issue, onClose }: { issue: Issue | null; onClose: () => void }) {
  const { user } = useAuth();
  const admin = isAdmin(user);
  const qc = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: IssueStatus }) => updateIssueStatus(id, status),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["issues"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed to update"),
  });

  return (
    <Dialog open={!!issue} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        {issue && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full">{issue.category}</Badge>
                <Badge className="rounded-full">{issue.status}</Badge>
              </div>
              <DialogTitle className="mt-2 font-display text-xl">{issue.title}</DialogTitle>
              <DialogDescription className="text-left">{issue.description}</DialogDescription>
            </DialogHeader>

            {issue.imageURL && (
              <img
                src={issue.imageURL}
                alt={issue.title}
                className="max-h-64 w-full rounded-xl object-cover"
              />
            )}

            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" /> {issue.location}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" /> {issue.createdAt.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertTriangle className="h-4 w-4" /> Urgency: {issue.urgency}
              </div>
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
              {admin ? (
                <Select
                  value={ISSUE_STATUSES.includes(issue.status) ? issue.status : "Pending"}
                  onValueChange={(v) =>
                    statusMutation.mutate({ id: issue.id, status: v as IssueStatus })
                  }
                  disabled={statusMutation.isPending}
                >
                  <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ISSUE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : <span className="text-xs text-muted-foreground">View only</span>}
              <Button variant="outline" onClick={onClose}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <ListChecks className="h-5 w-5" />
      </div>
      <h3 className="mt-3 font-display text-lg font-semibold">No issues match</h3>
      <p className="mt-1 text-sm text-muted-foreground">Try clearing your filters or report a new issue.</p>
      <Link to="/report"><Button className="mt-5">Report an Issue</Button></Link>
    </div>
  );
}
