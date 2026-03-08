import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Radio, ExternalLink, RefreshCw, CalendarOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface DigestItem {
  id: number;
  title: string;
  short_snippet: string | null;
  detailed_brief: string | null;
  published_date: string | null;
  gs_paper: string | null;
  category_tag: string | null;
  source_link: string | null;
  image_url: string | null;
}

function getTodayISO(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

function getTomorrowISO(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
}

function DigestSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4 sm:gap-6">
          <Skeleton className="w-20 h-4 hidden sm:block shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MorningDigest() {
  const [items, setItems] = useState<DigestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<DigestItem | null>(null);

  const fetchDigest = useCallback(async () => {
    setLoading(true);
    try {
      const today = getTodayISO();
      const tomorrow = getTomorrowISO();
      console.log("Fetching morning_digest for date range:", { today, tomorrow });

      const { data, error } = await supabase
        .from("morning_digest")
        .select("*")
        .gte("created_at", today)
        .lt("created_at", tomorrow)
        .order("id", { ascending: false });

      console.log("Morning Digest data:", data);
      console.log("Morning Digest error:", error);

      if (error) {
        console.error("Supabase Error:", error.message);
      }
      setItems(data && data.length > 0 ? data : []);
    } catch (err) {
      console.error("Unexpected Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDigest();
  }, [fetchDigest]);

  if (loading) return <DigestSkeleton />;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed rounded-lg border-muted-foreground/20">
        <CalendarOff className="w-8 h-8 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground text-center mb-4">
          Check back later for today's updates.
        </p>
        <Button variant="outline" size="sm" onClick={fetchDigest}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="py-2">
        <div className="flex items-center gap-2 mb-6">
          <Radio className="w-4 h-4 text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">
            Top curated points — updated daily
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-7 w-7"
            onClick={fetchDigest}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="relative">
          <div className="absolute left-[5.5rem] top-0 bottom-0 w-px bg-border hidden sm:block" />

          <div className="space-y-0">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative flex gap-4 sm:gap-6 pb-6 last:pb-0"
              >
                <div className="w-20 shrink-0 text-right hidden sm:block pt-1">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {item.published_date || "Today"}
                  </span>
                </div>

                <div className="relative hidden sm:flex items-start pt-1.5">
                  <div className="w-3 h-3 rounded-full bg-primary border-2 border-background shadow-[0_0_8px_hsl(var(--gold)/0.4)] -translate-x-1/2" />
                </div>

                <div
                  className="flex-1 glass-card p-4 hover:border-primary/20 transition-colors cursor-pointer"
                  onClick={() => item.detailed_brief && setSelectedItem(item)}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {item.category_tag && (
                      <span className="px-2 py-0.5 rounded-full bg-secondary text-foreground text-[10px] font-bold uppercase tracking-wider">
                        {item.category_tag}
                      </span>
                    )}
                    {item.gs_paper && (
                      <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold">
                        {item.gs_paper}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm text-foreground font-semibold leading-snug mb-1">
                    {item.title}
                  </h3>
                  {item.short_snippet && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.short_snippet}
                    </p>
                  )}
                  {item.detailed_brief && (
                    <div className="flex items-center gap-1 text-[10px] text-primary hover:underline mt-2">
                      Read More <ExternalLink className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg gold-gradient-text">
              {selectedItem?.title}
            </DialogTitle>
            <DialogDescription className="flex gap-2 pt-1">
              {selectedItem?.category_tag && (
                <span className="px-2 py-0.5 rounded-full bg-secondary text-foreground text-[10px] font-bold uppercase">
                  {selectedItem.category_tag}
                </span>
              )}
              {selectedItem?.gs_paper && (
                <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold">
                  {selectedItem.gs_paper}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="prose prose-sm prose-invert max-w-none text-foreground/90 leading-relaxed whitespace-pre-line mt-2">
            {selectedItem?.detailed_brief}
          </div>
          {selectedItem?.source_link && (
            <a
              href={selectedItem.source_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-4 border-t border-border pt-4"
            >
              View original source <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
