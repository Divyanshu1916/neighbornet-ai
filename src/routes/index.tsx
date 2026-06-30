import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type FeatureDetail = {
  icon: LucideIcon;
  t: string;
  d: string;
  intro: string;
  detail: string;
  bullets: string[];
  cta: { label: string; to?: string; action?: "login" };
};

const FEATURES: FeatureDetail[] = [
  {
    icon: Megaphone,
    t: "One-tap Reporting",
    d: "Title, category, urgency, location — submit in under 30 seconds.",
    intro: "Report any community issue in under 30 seconds.",
    detail:
      "This feature lets citizens quickly report local problems such as potholes, broken streetlights, garbage dumps, water leakage, road damage, illegal parking, public safety concerns, and more. Users simply enter a title, choose a category, set urgency, add a location, upload a photo, and submit the report.",
    bullets: [
      "Add issue title",
      "Select category",
      "Choose urgency level",
      "Enter location",
      "Upload image",
      "Submit instantly",
    ],
    cta: { label: "Report an Issue", to: "/report" },
  },
  {
    icon: MapPin,
    t: "Hyperlocal Feed",
    d: "See what's happening on your street, in your sector, in your city.",
    intro: "A live pulse of every issue in your neighborhood.",
    detail:
      "Browse and search every report from your community. Filter by category, status, or urgency to find what matters to you right now.",
    bullets: [
      "Search by keyword across all reports",
      "Filter by category, status, and urgency",
      "Open to everyone — no sign-in required to view",
      "Real-time updates as new issues are reported",
    ],
    cta: { label: "Explore Community Feed", to: "/feed" },
  },
  {
    icon: Zap,
    t: "Live Status Tracking",
    d: "Pending, In Progress, Solved — everyone sees the same source of truth.",
    intro: "Transparent progress from report to resolution.",
    detail:
      "Every issue carries a public status that updates in real time. No more guessing whether something is being worked on — the whole community sees the same answer.",
    bullets: [
      "Three clear states: Pending, In Progress, Solved",
      "Powered by Firestore real-time listeners",
      "Admin-controlled status changes for trust and accountability",
      "Status badges visible on every issue card",
    ],
    cta: { label: "View Dashboard", to: "/dashboard" },
  },
  {
    icon: Trophy,
    t: "Community Heroes",
    d: "Earn points for reporting and solving issues. Climb the leaderboard.",
    intro: "Recognition for the neighbors who show up.",
    detail:
      "Every report and resolution earns you points. The leaderboard celebrates the most active members of your community — the people quietly making the block better.",
    bullets: [
      "Points for issues reported and issues solved",
      "Public leaderboard ranks top contributors",
      "Profile page tracks your personal impact",
      "Open and transparent scoring",
    ],
    cta: { label: "See the Leaderboard", to: "/leaderboard" },
  },
  {
    icon: ShieldCheck,
    t: "Secure Sign-In",
    d: "Google authentication. No spam, no fake accounts.",
    intro: "Trusted identity for a trusted community.",
    detail:
      "Sign in with Google in a single tap. We never see or store your password, and only real accounts can participate — keeping the feed clean and credible.",
    bullets: [
      "One-tap Google Sign-In",
      "No passwords stored, no email spam",
      "Public pages remain open for browsing",
      "Admin-only controls for sensitive actions",
    ],
    cta: { label: "Sign In with Google", action: "login" },
  },
  {
    icon: Sparkles,
    t: "AI-Assisted Triage",
    d: "Smart category and urgency suggestions to speed up response.",
    intro: "An on-device classifier that thinks while you type.",
    detail:
      "As you describe an issue, NeighborNet AI scans for keywords and suggests the right category and urgency level — so reports are tagged consistently and the most critical ones rise to the top.",
    bullets: [
      "Keyword-based, runs entirely in your browser",
      "Suggests category: Garbage, Road Damage, Water Leakage, and more",
      "Suggests urgency: High, Medium, or Low",
      "One-click apply — you stay in control",
    ],
    cta: { label: "Try the Report Form", to: "/report" },
  },
];

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
  const navigate = useNavigate();
  const [openFeature, setOpenFeature] = useState<FeatureDetail | null>(null);

  const handleCta = (f: FeatureDetail) => {
    setOpenFeature(null);
    if (f.cta.action === "login") {
      if (!user) {
        toast.info("Sign in to continue.");
        login();
      }
      return;
    }
    if (f.cta.to) {
      const protectedRoutes = ["/report", "/dashboard"];
      if (!user && protectedRoutes.includes(f.cta.to)) {
        toast.info("Please sign in to continue.");
        login();
        return;
      }
      navigate({ to: f.cta.to });
    }
  };

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
          {FEATURES.map((f, i) => (
            <motion.button
              key={f.t}
              type="button"
              onClick={() => setOpenFeature(f)}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 text-left shadow-soft transition-all hover:shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label={`Learn more about ${f.t}`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-hero text-white shadow-soft">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-80 transition-opacity group-hover:opacity-100">
                Learn more <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </motion.button>
          ))}
        </div>
      </section>

      {/* FEATURE MODAL */}
      <Dialog open={!!openFeature} onOpenChange={(o) => !o && setOpenFeature(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          {openFeature && (
            <>
              <DialogHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-hero text-white shadow-soft">
                  <openFeature.icon className="h-6 w-6" />
                </div>
                <DialogTitle className="mt-3 font-display text-2xl">{openFeature.t}</DialogTitle>
                <DialogDescription className="text-base">{openFeature.intro}</DialogDescription>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">{openFeature.detail}</p>
              <ul className="space-y-2">
                {openFeature.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button variant="outline" onClick={() => setOpenFeature(null)} className="rounded-xl">
                  Close
                </Button>
                <Button onClick={() => handleCta(openFeature)} className="rounded-xl">
                  {openFeature.cta.label} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

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
