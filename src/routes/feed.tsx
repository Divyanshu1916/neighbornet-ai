import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, Plus, Inbox } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IssueCard } from "@/components/site/IssueCard";
import { listIssues, type Issue, type IssueStatus } from "@/lib/issues";

export const Route = createFileRoute("/feed")({
  head: () => ({ meta: [{ title: "Community Feed — NeighborNet AI" }] }),
  component: FeedPage,
});

const filters: ("All" | IssueStatus)[] = ["All", "Pending", "Verified", "Assigned", "In Progress", "Resolved", "Closed"];

function FeedPage() {
  const { data: issues = [], isLoading, error } = useQuery({ queryKey: ["issues"], queryFn: listIssues });
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");

  const filtered = useMemo(() => {
    return issues.filter((i: Issue) => {
      const matchesQ =
        !q ||
        i.title.toLowerCase().includes(q.toLowerCase()) ||
        i.location.toLowerCase().includes(q.toLowerCase()) ||
        i.category.toLowerCase().includes(q.toLowerCase());
      const matchesF = filter === "All" || i.status === filter;
      return matchesQ && matchesF;
    });
  }, [issues, q, filter]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Community Feed</h1>
          <p className="text-sm text-muted-foreground">Live issues across the neighborhood.</p>
        </div>
        <Link to="/report"><Button className="rounded-xl"><Plus className="mr-2 h-4 w-4" />Report Issue</Button></Link>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, location, or category"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-accent"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          Couldn't load issues: {error instanceof Error ? error.message : "Unknown error"}.
          Make sure Firestore is enabled and rules allow access.
        </div>
      ) : isLoading ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Inbox className="h-5 w-5" />
          </div>
          <h3 className="mt-3 font-display text-lg font-semibold">No issues match</h3>
          <p className="mt-1 text-sm text-muted-foreground">Try a different filter or search term.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((i, idx) => <IssueCard key={i.id} issue={i} index={idx} />)}
        </div>
      )}
    </div>
  );
}
