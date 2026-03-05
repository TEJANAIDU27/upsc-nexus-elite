import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, ExternalLink, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface DigestItem {
  id: number;
  title?: string | null;
  short_snippet: string | null;
  detailed_brief: string | null;
  published_date: string | null;
  gs_paper: string | null;
  category_tag: string | null;
  source_link: string | null;
  image_url: string | null;
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "Just now"; // Fallback for null dates
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch {
    return "Today";
  }
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

  useEffect(() => {
    async function fetchDigest() {
      setLoading(true);
      try {
        // We order by 'id' descending so the newest database entries show first, 
        // even if the 'published_date' column is null.
        const { data, error } = await supabase
          .from("morning_digest")
          .select("*")
          .order("id", { ascending: false }) 
          .limit(10);

        if (error) {
          console.error("Supabase Error:", error.message);
        } else if (data) {
          console.log("Morning Digest Data Loaded:", data);
          setItems(data);
        }
      } catch (err) {
        console.error("Unexpected Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDigest();
  }, []);

  if (loading) return <DigestSkeleton />;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed rounded-lg border-muted-foreground/20">
        <p className="text-sm text-muted-foreground text-center">
          No digest items found in the database. 
          <br />
          <span className="text-[10px]">Check your n8n connection or RLS policies.</span>
        </p>
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
        </div>

        <div className="relative">
          {/* Timeline line */}
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
                {/* Time */}
                <div className="w-20 shrink-0 text-right hidden sm:block pt-1">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {formatTime(item.published_date)}
                  </span>
                </div>

                {/* Dot */}
                <div className="relative hidden sm:flex items-start pt-1.5">
                  <div className="w-3 h-3 rounded-full bg-primary border-2 border-background shadow-[0_0_8px_hsl(var(--gold)/0.4)] -translate-x-1/2" />
                </div>

                {/* Content */}
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
                      <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text
