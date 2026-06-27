import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export function Protected({ children }: { children: ReactNode }) {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      // stay on page; show sign-in CTA inline
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-12 sm:px-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-hero text-white shadow-card">
          <LogIn className="h-6 w-6" />
        </div>
        <h2 className="mt-5 font-display text-2xl font-bold">Sign in required</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with Google to access this page and start helping your community.
        </p>
        <Button className="mt-6" onClick={login}>Sign in with Google</Button>
      </div>
    );
  }

  return <>{children}</>;
}
