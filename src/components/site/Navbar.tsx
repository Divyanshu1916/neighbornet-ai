import { Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, LogOut, Network } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { isAdmin } from "@/lib/admin";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { NotificationBell } from "@/components/site/NotificationBell";


const baseLinks = [
  { to: "/", label: "Home" },
  { to: "/feed", label: "Feed" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/dashboard", label: "Dashboard" },
];

export function Navbar() {
  const { user, login, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-hero text-white shadow-soft">
            <Network className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">
            NeighborNet <span className="text-primary">AI</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "bg-accent text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />

          <Button
            size="sm"
            variant="default"
            onClick={() => {
              if (user) {
                router.navigate({ to: "/report" });
              } else {
                toast.info("Please sign in to report an issue.");
                login();
              }
            }}
          >
            Report Issue
          </Button>

          {user ? (
            <>
              <Link to="/profile" className="flex items-center gap-2">
                {isAdmin(user) && (
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    Admin
                  </span>
                )}
                <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                  <AvatarImage src={user.photoURL ?? undefined} />
                  <AvatarFallback>
                    {user.displayName?.[0] ?? user.email?.[0] ?? "U"}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <Button size="icon" variant="ghost" onClick={logout} aria-label="Logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={login}>
              Sign in with Google
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            className="rounded-lg p-2 hover:bg-accent"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

      </div>

      {open && (
        <div className="border-t border-border md:hidden">
          <div className="space-y-1 px-4 py-3">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
                activeProps={{ className: "bg-accent text-foreground" }}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 pt-2">
              <Button
                onClick={() => {
                  setOpen(false);
                  if (user) {
                    router.navigate({ to: "/report" });
                  } else {
                    toast.info("Please sign in to report an issue.");
                    login();
                  }
                }}
              >
                Report Issue
              </Button>
              {user ? (
                <Button variant="outline" onClick={() => { setOpen(false); logout(); }}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
              ) : (
                <Button variant="outline" onClick={() => { setOpen(false); login(); }}>Sign in with Google</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
