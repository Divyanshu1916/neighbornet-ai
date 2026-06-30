import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Check, CheckCheck, Trash2, MapPin, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  subscribeNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  type AppNotification,
} from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

export function NotificationBell() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsub = subscribeNotifications(setItems, (e) =>
      console.warn("notifications subscribe error", e),
    );
    return () => unsub();
  }, []);

  const unread = items.filter((n) => !n.read).length;

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      toast.success("All notifications marked read");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative rounded-lg p-2 transition-colors hover:bg-accent"
          aria-label="Admin notifications"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(92vw,380px)] overflow-hidden rounded-2xl border-border p-0 shadow-card"
      >
        <div className="flex items-center justify-between border-b border-border bg-soft px-4 py-3">
          <div>
            <div className="font-display text-sm font-semibold">Notifications</div>
            <div className="text-[11px] text-muted-foreground">
              {unread} unread · {items.length} total
            </div>
          </div>
          {items.length > 0 && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleMarkAll}>
              <CheckCheck className="mr-1 h-3.5 w-3.5" /> Mark all
            </Button>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              <AnimatePresence initial={false}>
                {items.map((n) => (
                  <motion.li
                    key={n.id}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`relative px-4 py-3 text-sm ${!n.read ? "bg-primary/5" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                            New Issue Reported
                          </span>
                        </div>
                        <div className="mt-1 truncate font-medium">{n.title}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                          <span className="rounded-full border border-border bg-card px-1.5 py-0.5">
                            {n.category}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {n.location}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> {n.urgency}
                          </span>
                        </div>
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          By {n.reporterName ?? n.reporterEmail} ·{" "}
                          {n.createdAt.toLocaleString()}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <Link
                            to="/admin"
                            onClick={() => setOpen(false)}
                            className="rounded-md border border-border bg-card px-2 py-1 text-[11px] font-medium hover:bg-accent"
                          >
                            View Issue
                          </Link>
                          {!n.read && (
                            <button
                              onClick={() => markNotificationRead(n.id, true)}
                              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11px] font-medium hover:bg-accent"
                            >
                              <Check className="h-3 w-3" /> Mark read
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(n.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1 text-[11px] font-medium text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
