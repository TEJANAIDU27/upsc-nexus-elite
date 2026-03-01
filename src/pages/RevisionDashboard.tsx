import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, BookOpen, Tag, ChevronDown, ChevronUp, Newspaper } from "lucide-react";
import { ShimmerCard } from "@/components/ShimmerLoaders";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface SavedNews {
  id: string;
  headline: string;
  summary: string | null;
  gs_tag: string | null;
  date: string | null;
}

export default function RevisionDashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState<SavedNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<string>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (supabase.from("saved_news") as any)
      .select("id, headline, summary, gs_tag, date")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }: any) => {
        if (data) setItems(data);
        setLoading(false);
      });
  }, [user]);

  // Group by gs_tag
  const tagSet = new Set<string>();
  items.forEach((n) => {
    if (n.gs_tag) {
      // Split compound tags like "GS Paper 2: Education; GS Paper 3: Science"
      n.gs_tag.split(";").forEach((t) => tagSet.add(t.trim()));
    }
  });
  const tags = ["All", ...Array.from(tagSet).sort()];

  const filtered = activeTag === "All"
    ? items
    : items.filter((n) => n.gs_tag?.includes(activeTag));

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Please sign in to view your revision notes.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="font-serif text-3xl font-bold">
            <span className="gold-gradient-text">Revision Dashboard</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Your saved news grouped by GS tag for focused revision
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Brain className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground">{filtered.length}</span> items
        </div>
      </motion.div>

      {/* Tag Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {tags.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTag(t)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
              activeTag === t
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <ShimmerCard key={i} className="h-20" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-12 text-center"
        >
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-serif text-xl font-bold mb-2">No Saved Items</h3>
          <p className="text-muted-foreground text-sm">
            Bookmark news from the Dashboard to build your revision library.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, i) => {
            const isOpen = expandedId === item.id;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card-hover overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isOpen ? null : item.id)}
                  className="w-full p-4 flex items-start gap-3 text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Newspaper className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {item.gs_tag && item.gs_tag.split(";").map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold uppercase tracking-wide"
                        >
                          <Tag className="w-2.5 h-2.5" />
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                    <h3 className="font-serif text-sm font-semibold text-foreground">{item.headline}</h3>
                  </div>
                  <span className="shrink-0 text-muted-foreground">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </button>
                {isOpen && item.summary && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="border-t border-border px-4 pb-4 pt-3"
                  >
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{item.summary}</p>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
