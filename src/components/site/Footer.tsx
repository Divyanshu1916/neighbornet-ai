import { Network } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-soft">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-hero text-white">
                <Network className="h-5 w-5" />
              </div>
              <span className="font-display text-lg font-bold">
                NeighborNet <span className="text-primary">AI</span>
              </span>
            </div>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              The hyperlocal problem solver. Report, track, and resolve community
              issues together — one neighborhood at a time.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Product</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Feed</li>
              <li>Dashboard</li>
              <li>Leaderboard</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Community</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Heroes</li>
              <li>Guidelines</li>
              <li>Support</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-start justify-between gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} NeighborNet AI. Built for neighborhoods.</p>
          <p>Made with care for civic communities.</p>
        </div>
      </div>
    </footer>
  );
}
