import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Network, Mail, X, Shield, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";

const GUIDELINES = [
  "Report only genuine community issues.",
  "Do not post fake or misleading reports.",
  "Add a clear title and description.",
  "Use accurate location details.",
  "Upload an image only if available.",
  "Do not share private personal information.",
  "Use respectful language.",
  "Avoid spam or duplicate reports.",
  "Mark issues as resolved only when actually solved.",
  "Help keep the community safe and clean.",
];

function Modal({
  open,
  onClose,
  title,
  icon: Icon,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-hero text-white">
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="font-display text-xl font-semibold">{title}</h3>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export function Footer() {
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  const productLinks = [
    { label: "Feed", to: "/feed" },
    { label: "Dashboard", to: "/dashboard" },
    { label: "Leaderboard", to: "/leaderboard" },
  ];

  const communityLinks = [
    { label: "Heroes", to: "/leaderboard" },
    { label: "Guidelines", action: () => setGuidelinesOpen(true) },
    { label: "Support", action: () => setSupportOpen(true) },
  ];

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
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="inline-block transition-colors hover:text-primary hover:translate-x-0.5 active:scale-95 cursor-pointer"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Community</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {communityLinks.map((link) => (
                <li key={link.label}>
                  {"to" in link ? (
                    <Link
                      to={link.to!}
                      className="inline-block transition-colors hover:text-primary hover:translate-x-0.5 active:scale-95 cursor-pointer"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <button
                      onClick={link.action}
                      className="inline-block transition-colors hover:text-primary hover:translate-x-0.5 active:scale-95 cursor-pointer text-left"
                    >
                      {link.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-start justify-between gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} NeighborNet AI. Built for neighborhoods.</p>
          <p>Made with care for civic communities.</p>
        </div>
      </div>

      {/* Guidelines Modal */}
      <Modal
        open={guidelinesOpen}
        onClose={() => setGuidelinesOpen(false)}
        title="Community Guidelines"
        icon={Shield}
      >
        <ul className="space-y-3">
          {GUIDELINES.map((rule) => (
            <li key={rule} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </Modal>

      {/* Support Modal */}
      <Modal
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
        title="Support"
        icon={LifeBuoy}
      >
        <p className="text-sm text-muted-foreground">
          For help, feedback, bug reports, or support, contact:
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">
          prasadhello123456@gmail.com
        </p>
        <div className="mt-4">
          <Button
            asChild
            variant="default"
            className="rounded-xl"
          >
            <a href="mailto:prasadhello123456@gmail.com" className="inline-flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Support
            </a>
          </Button>
        </div>
      </Modal>
    </footer>
  );
}
