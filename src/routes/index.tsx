import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  MapPin,
  Megaphone,
  Trophy,
  Zap,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";

function HeroStats() {
  const [stats, setStats] = useState<{ reported: number; resolved: number; neighborhoods: number } | null>(null);
  useEffect(() => {
    const { db } = getFirebase();
    if (!db) {
      setStats({ reported: 0, resolved: 0, neighborhoods: 0 });
      return;
    }
    const unsub = onSnapshot(
      collection(db, "issues"),
      (snap) => {
        let reported = 0;
        let resolved = 0;
        const locs = new Set<string>();
        snap.forEach((d) => {
          const data = d.data() as { status?: string; location?: string };
          reported += 1;
          if (data.status === "Solved") resolved += 1;
          if (data.location && data.location.trim()) locs.add(data.location.trim().toLowerCase());
        });
        setStats({ reported, resolved, neighborhoods: locs.size });
      },
      () => setStats({ reported: 0, resolved: 0, neighborhoods: 0 }),
    );
    return () => unsub();
  }, []);

  const items = [
    { n: stats?.reported ?? 0, l: "Issues reported" },
    { n: stats?.resolved ?? 0, l: "Resolved" },
    { n: stats?.neighborhoods ?? 0, l: "Neighborhoods" },
  ];

  return (
    <div className="mt-10 grid grid-cols-3 gap-4 text-center sm:max-w-md sm:mx-auto">
      {items.map((s) => (
        <div key={s.l} className="rounded-2xl border border-border bg-card/60 px-3 py-4 shadow-soft">
          {stats === null ? (
            <Skeleton className="mx-auto h-7 w-12" />
          ) : (
            <div className="font-display text-2xl font-bold text-primary">{s.n.toLocaleString()}</div>
          )}
          <div className="mt-1 text-xs text-muted-foreground">{s.l}</div>
        </div>
      ))}
    </div>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NeighborNet AI — Hyperlocal Community Hero" },
      { name: "description", content: "Report local problems, rally your neighbors, and resolve issues together with NeighborNet AI." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, login } = useAuth();
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-soft" />
        <div className="absolute -top-32 right-[-10%] -z-10 h-[480px] w-[480px] rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 left-[-10%] -z-10 h-[420px] w-[420px] rounded-full bg-primary-glow/30 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:pt-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Hyperlocal Problem Solver
            </div>
            <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
              Be the <span className="bg-hero bg-clip-text text-transparent">Community Hero</span> your neighborhood needs.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
              NeighborNet AI helps citizens report local problems — from potholes to power cuts — and lets the whole community track and resolve them together.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {user ? (
                <Link to="/report">
                  <Button size="lg" className="rounded-xl">
                    Report an Issue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Button
                  size="lg"
                  onClick={() => {
                    toast.info("Please sign in to report an issue.");
                    login();
                  }}
                  className="rounded-xl"
                >
                  Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              <Link to="/feed">
                <Button size="lg" variant="outline" className="rounded-xl">
                  Explore Community Feed
                </Button>
              </Link>
            </div>

            <HeroStats />
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Everything your block needs</h2>
          <p className="mt-3 text-muted-foreground">A complete civic toolkit for everyday neighborhood problems.</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Megaphone, t: "One-tap Reporting", d: "Title, category, urgency, location — submit in under 30 seconds." },
            { icon: MapPin, t: "Hyperlocal Feed", d: "See what's happening on your street, in your sector, in your city." },
            { icon: Zap, t: "Live Status Tracking", d: "Pending, In Progress, Solved — everyone sees the same source of truth." },
            { icon: Trophy, t: "Community Heroes", d: "Earn points for reporting and solving issues. Climb the leaderboard." },
            { icon: ShieldCheck, t: "Secure Sign-In", d: "Google authentication. No spam, no fake accounts." },
            { icon: Sparkles, t: "AI-Assisted Triage", d: "Smart category and urgency suggestions to speed up response." },
          ].map((f, i) => (
            <motion.div
              key={f.t}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-hero text-white shadow-soft">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-soft py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">How it works</h2>
            <p className="mt-3 text-muted-foreground">Three steps from a frustration to a fix.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { n: "01", t: "Spot it", d: "See a pothole, leak, or broken light? Snap the details." },
              { n: "02", t: "Report it", d: "Submit with category, urgency, and exact location." },
              { n: "03", t: "Solve it", d: "Neighbors and authorities track progress until it's resolved." },
            ].map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="relative overflow-hidden rounded-2xl border border-border bg-card p-7 shadow-soft"
              >
                <div className="absolute -right-2 -top-2 select-none font-display text-7xl font-extrabold text-primary/10">
                  {s.n}
                </div>
                <CheckCircle2 className="h-6 w-6 text-primary" />
                <h3 className="mt-4 font-display text-xl font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-hero p-10 text-center text-white shadow-card sm:p-16">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Your block deserves better.</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/85">
            Join thousands of neighbors making real change happen — one report at a time.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {user ? (
              <Link to="/dashboard">
                <Button size="lg" variant="secondary" className="rounded-xl">Open Dashboard</Button>
              </Link>
            ) : (
              <Button size="lg" variant="secondary" className="rounded-xl" onClick={login}>
                Sign in & Get Started
              </Button>
            )}
            <Link to="/leaderboard">
              <Button size="lg" variant="outline" className="rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                See Heroes
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
