import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Mail, LogOut, Sparkles } from "lucide-react";
import { Protected } from "@/components/site/Protected";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { listIssues, type Issue } from "@/lib/issues";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — NeighborNet AI" }] }),
  component: () => (
    <Protected>
      <ProfilePage />
    </Protected>
  ),
});

function ProfilePage() {
  const { user, logout } = useAuth();
  const { data: issues = [] } = useQuery({ queryKey: ["issues"], queryFn: listIssues });

  const mine = issues.filter((i: Issue) => i.userEmail === user?.email);
  const reports = mine.length;
  const solved = mine.filter((i) => i.status === "Solved").length;
  const points = reports * 10 + solved * 25;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-3xl border border-border bg-card shadow-card"
      >
        <div className="relative h-32 bg-hero">
          <div className="absolute -bottom-12 left-6">
            <Avatar className="h-24 w-24 ring-4 ring-card">
              <AvatarImage src={user?.photoURL ?? undefined} />
              <AvatarFallback className="text-2xl">{user?.displayName?.[0] ?? "U"}</AvatarFallback>
            </Avatar>
          </div>
        </div>
        <div className="px-6 pb-6 pt-16">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold">{user?.displayName ?? "Neighbor"}</h1>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />{user?.email}
              </p>
            </div>
            <Button variant="outline" onClick={logout}><LogOut className="mr-2 h-4 w-4" />Logout</Button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatBlock label="Total Reports" value={reports} />
            <StatBlock label="Total Solved" value={solved} accent />
            <StatBlock label="Community Points" value={points} hero />
          </div>

          <div className="mt-6 flex items-center gap-2 rounded-2xl border border-border bg-soft p-4 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            Every report earns 10 points. Each solved issue adds 25 more.
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function StatBlock({ label, value, accent, hero }: { label: string; value: number; accent?: boolean; hero?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 shadow-soft ${
      hero ? "bg-hero text-white" : accent ? "bg-success/10 border border-success/20" : "border border-border bg-card"
    }`}>
      <div className={`text-xs font-medium ${hero ? "text-white/80" : "text-muted-foreground"}`}>{label}</div>
      <div className="mt-2 font-display text-3xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
