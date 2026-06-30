import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ListChecks, Clock, Loader2, CheckCircle2, Plus } from "lucide-react";
import { listIssues, isResolvedStatus, type Issue } from "@/lib/issues";
import { Protected } from "@/components/site/Protected";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IssueCard } from "@/components/site/IssueCard";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — NeighborNet AI" }] }),
  component: () => (
    <Protected>
      <DashboardPage />
    </Protected>
  ),
});

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

      <div className="mt-10">
        {error && (
          <div className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Couldn't load issues: {error instanceof Error ? error.message : "Unknown error"}.
          </div>
        )}
        <h2 className="font-display text-xl font-semibold">Recent Issues</h2>
        {isLoading ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
          </div>
        ) : issues.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {issues.slice(0, 6).map((i, idx) => (
              <IssueCard key={i.id} issue={i} index={idx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <ListChecks className="h-5 w-5" />
      </div>
      <h3 className="mt-3 font-display text-lg font-semibold">No issues yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">Be the first to report a problem in your neighborhood.</p>
      <Link to="/report"><Button className="mt-5">Report an Issue</Button></Link>
    </div>
  );
}
