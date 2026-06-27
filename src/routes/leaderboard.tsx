import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Trophy, Medal, Award } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { listIssues, buildLeaderboard } from "@/lib/issues";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — NeighborNet AI" }] }),
  component: LeaderboardPage,
});

const trophyFor = (rank: number) => {
  if (rank === 0) return { icon: Trophy, cls: "text-[oklch(0.78_0.16_85)]" };
  if (rank === 1) return { icon: Medal, cls: "text-[oklch(0.7_0.05_250)]" };
  if (rank === 2) return { icon: Award, cls: "text-[oklch(0.6_0.12_50)]" };
  return null;
};

function LeaderboardPage() {
  const { data: issues = [], isLoading } = useQuery({ queryKey: ["issues"], queryFn: listIssues });
  const board = buildLeaderboard(issues);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="text-center">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-hero text-white shadow-card">
          <Trophy className="h-6 w-6" />
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Community Heroes</h1>
        <p className="mt-2 text-muted-foreground">Top neighbors making the biggest difference.</p>
      </div>

      <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="grid grid-cols-12 gap-3 border-b border-border bg-soft px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <div className="col-span-1">#</div>
          <div className="col-span-5">User</div>
          <div className="col-span-2 text-right">Reported</div>
          <div className="col-span-2 text-right">Solved</div>
          <div className="col-span-2 text-right">Points</div>
        </div>

        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
          </div>
        ) : board.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">No heroes yet — be the first.</div>
        ) : (
          board.map((row, i) => {
            const t = trophyFor(i);
            return (
              <motion.div
                key={row.email}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className="grid grid-cols-12 items-center gap-3 border-b border-border/60 px-5 py-4 last:border-b-0 hover:bg-accent/40"
              >
                <div className="col-span-1 flex items-center gap-1 font-display text-lg font-bold text-muted-foreground">
                  {i + 1}
                  {t && <t.icon className={`h-4 w-4 ${t.cls}`} />}
                </div>
                <div className="col-span-5 flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {row.name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate font-medium">{row.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{row.email}</div>
                  </div>
                </div>
                <div className="col-span-2 text-right tabular-nums">{row.reported}</div>
                <div className="col-span-2 text-right tabular-nums text-[oklch(0.45_0.13_155)]">{row.solved}</div>
                <div className="col-span-2 text-right font-display text-lg font-bold text-primary">{row.points}</div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
