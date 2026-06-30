import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert, ListChecks, Clock, ShieldCheck, UserCheck, Loader2,
  CheckCircle2, XCircle, Users, MapPin,
} from "lucide-react";
import { collection, onSnapshot, query, orderBy, Timestamp } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { isAdmin } from "@/lib/admin";
import { isResolvedStatus, type Issue, type IssueCategory, type IssueStatus, type IssueUrgency } from "@/lib/issues";
import { IssueCard } from "@/components/site/IssueCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — NeighborNet AI" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, loading, login } = useAuth();
  const admin = isAdmin(user);

  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!admin) return;
    const { db } = getFirebase();
    if (!db) return;
    const q = query(collection(db, "issues"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items: Issue[] = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          const created = data.createdAt;
          const createdAt =
            created instanceof Timestamp ? created.toDate() : new Date();
          return {
            id: d.id,
            title: (data.title as string) ?? "",
            description: (data.description as string) ?? "",
            category: (data.category as IssueCategory) ?? "Other",
            location: (data.location as string) ?? "",
            urgency: (data.urgency as IssueUrgency) ?? "Low",
            status: (data.status as IssueStatus) ?? "Pending",
            userEmail: (data.userEmail as string) ?? "",
            userName: data.userName as string | undefined,
            userId: (data.userId as string | null) ?? null,
            imageURL: (data.imageURL as string | null) ?? null,
            createdAt,
          };
        });
        setIssues(items);
      },
      (e) => setErr(e.message),
    );
    return () => unsub();
  }, [admin]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-12">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" />
        </div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="mt-5 font-display text-2xl font-bold">Admins only</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This area is reserved for NeighborNet AI administrators.
        </p>
        {!user ? (
          <Button className="mt-6" onClick={login}>Sign in with Google</Button>
        ) : (
          <Link to="/" className="mt-6 text-sm text-primary hover:underline">Back home</Link>
        )}
      </div>
    );
  }

  const list = issues ?? [];
  const stats = [
    { label: "Total Reported", value: list.length, icon: ListChecks, tone: "bg-primary/10 text-primary" },
    { label: "Pending", value: list.filter((i) => i.status === "Pending").length, icon: Clock, tone: "bg-warning/15 text-[oklch(0.45_0.15_60)]" },
    { label: "Verified", value: list.filter((i) => i.status === "Verified").length, icon: ShieldCheck, tone: "bg-primary/10 text-primary" },
    { label: "Assigned", value: list.filter((i) => i.status === "Assigned").length, icon: UserCheck, tone: "bg-info/15 text-[oklch(0.4_0.16_240)]" },
    { label: "In Progress", value: list.filter((i) => i.status === "In Progress").length, icon: Loader2, tone: "bg-info/15 text-[oklch(0.4_0.16_240)]" },
    { label: "Resolved", value: list.filter((i) => i.status === "Resolved" || i.status === "Solved").length, icon: CheckCircle2, tone: "bg-success/15 text-[oklch(0.35_0.15_155)]" },
    { label: "Closed", value: list.filter((i) => i.status === "Closed").length, icon: XCircle, tone: "bg-muted text-muted-foreground" },
  ];

  const uniqueReporters = new Set(list.map((i) => i.userEmail)).size;
  const neighborhoods = new Set(list.map((i) => (i.location || "").trim().toLowerCase()).filter(Boolean)).size;
  const resolvedPct = list.length === 0
    ? 0
    : Math.round((list.filter((i) => isResolvedStatus(i.status)).length / list.length) * 100);

  // Simple analytics: category breakdown
  const categories = Array.from(new Set(list.map((i) => i.category)));
  const catTotals = categories.map((c) => ({
    name: c,
    count: list.filter((i) => i.category === c).length,
  })).sort((a, b) => b.count - a.count);
  const maxCat = Math.max(1, ...catTotals.map((c) => c.count));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Moderate reports, manage statuses, and monitor your community.</p>
        </div>
        <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          Admin
        </span>
      </div>

      {err && (
        <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {err}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            className="rounded-2xl border border-border bg-card p-5 shadow-soft"
          >
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.tone}`}>
                <s.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 font-display text-3xl font-bold">{s.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Reporters</div>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold">{uniqueReporters}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Neighborhoods</div>
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 font-display text-2xl font-bold">{neighborhoods}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="text-xs text-muted-foreground">Resolution rate</div>
          <div className="mt-2 font-display text-2xl font-bold">{resolvedPct}%</div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-success" style={{ width: `${resolvedPct}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h2 className="font-display text-lg font-semibold">Reports by category</h2>
        <div className="mt-4 space-y-3">
          {catTotals.length === 0 ? (
            <div className="text-sm text-muted-foreground">No data yet.</div>
          ) : catTotals.map((c) => (
            <div key={c.name}>
              <div className="flex justify-between text-xs">
                <span className="font-medium">{c.name}</span>
                <span className="tabular-nums text-muted-foreground">{c.count}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(c.count / maxCat) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl font-semibold">All Reports</h2>
        {issues === null ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
          </div>
        ) : list.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No reports yet.
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {list.map((i, idx) => <IssueCard key={i.id} issue={i} index={idx} />)}
          </div>
        )}
      </div>
    </div>
  );
}
