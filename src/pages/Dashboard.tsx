import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Newspaper, Tag, Clock, Play, TrendingUp, Users, Award, Sun, LayoutGrid, Bookmark, Loader2, RefreshCw } from "lucide-react";
import { ShimmerHero } from "@/components/ShimmerLoaders";
import { MorningDigest } from "@/components/MorningDigest";
import { MainsPractice } from "@/components/MainsPractice";
import { useNews } from "@/contexts/NewsContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import heroBg from "@/assets/hero-bg.jpg";
import { NEWS_SOURCES, normalizeNewsItems, type NewsItem, type NewsSourceId } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const videoFeeds = [
  { title: "Indian Polity - Laxmikanth Summary", channel: "UPSC Nexus", duration: "45:20", views: "12K" },
  { title: "Economy - Budget 2025 Analysis", channel: "UPSC Nexus", duration: "38:15", views: "8.5K" },
  { title: "Geography - Monsoon Patterns", channel: "UPSC Nexus", duration: "52:10", views: "15K" },
  { title: "History - Modern India Timeline", channel: "UPSC Nexus", duration: "41:30", views: "10K" },
  { title: "Ethics - Case Study Approach", channel: "UPSC Nexus", duration: "33:45", views: "6.2K" },
  { title: "Current Affairs - Weekly Digest", channel: "UPSC Nexus", duration: "28:00", views: "20K" },
];

const stats = [
  { icon: Users, label: "Active Aspirants", value: "50,000+" },
  { icon: Award, label: "Selections", value: "1,200+" },
  { icon: TrendingUp, label: "Success Rate", value: "78%" },
];

type Tab = "news" | "morning";

function parseSyllabusBadge(gsTag: string): string {
  const tagMap: Record<string, string> = {
    "GS1": "GS1: History & Geography",
    "GS2": "GS2: Polity & Governance",
    "GS3": "GS3: Economy & Environment",
    "GS4": "GS4: Ethics & Integrity",
  };
  const key = Object.keys(tagMap).find((k) => gsTag?.toUpperCase().includes(k));
  return key ? tagMap[key] : gsTag || "General Studies";
}

export default function Dashboard() {
  const { user } = useAuth();
  const { news, loading, error, fetchNews } = useNews();
  const [activeTab, setActiveTab] = useState<Tab>("news");
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [savedHeadlines, setSavedHeadlines] = useState<Set<string>>(new Set());
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSource, setSelectedSource] = useState<NewsSourceId>("economic-times");
  const [sourceNews, setSourceNews] = useState<NewsItem[] | null>(null);
  const [sourceFetching, setSourceFetching] = useState(false);

  // No auto-fetch on mount — user must select a source and click Fetch News

  const handleFetchBySource = async () => {
    const source = NEWS_SOURCES.find((s) => s.id === selectedSource);
    if (!source) return;
    setSourceFetching(true);
    try {
      const res = await fetch(source.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user?.email ?? null, user_id: user?.id ?? null }),
      });
      const data = await res.json();
      const items = normalizeNewsItems(data);
      setSourceNews(items);
      toast.success(`Fetched ${items.length} articles from ${source.label}`);
    } catch (err: any) {
      toast.error("Failed to fetch news. Please try again.");
    } finally {
      setSourceFetching(false);
    }
  };

  const displayedNews = sourceNews ?? [];

  // Fetch saved news headlines for current user
  useEffect(() => {
    if (!user) return;
    (supabase.from("saved_news") as any)
      .select("headline")
      .eq("user_id", user.id)
      .then(({ data }: any) => {
        if (data) setSavedHeadlines(new Set(data.map((d: any) => d.headline)));
      });
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await handleFetchBySource();
    setRefreshing(false);
  };

  const handleSaveNews = async (item: NewsItem, index: number) => {
    if (!user) {
      toast.error("Please sign in to save news");
      return;
    }
    setSavingIndex(index);
    const isSaved = savedHeadlines.has(item.headline);

    try {
      if (isSaved) {
        const { error } = await (supabase.from("saved_news") as any)
          .delete()
          .eq("user_id", user.id)
          .eq("headline", item.headline);
        if (error) throw error;
        setSavedHeadlines((prev) => {
          const next = new Set(prev);
          next.delete(item.headline);
          return next;
        });
        toast.success("Removed from Archive");
      } else {
        const { error } = await (supabase.from("saved_news") as any).insert({
          user_id: user.id,
          headline: item.headline,
          summary: item.summary || null,
          gs_tag: item.gs_tag || null,
          date: item.date || null,
        });
        if (error) throw error;
        setSavedHeadlines((prev) => new Set(prev).add(item.headline));
        toast.success("News saved to Archive");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSavingIndex(null);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap justify-center gap-6 sm:gap-10 mb-12"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-2 text-sm">
                <stat.icon className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">{stat.label}:</span>
                <span className="font-semibold text-foreground">{stat.value}</span>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="text-center mb-10"
          >
            <div className="flex items-center justify-center gap-3">
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
                <span className="gold-gradient-text">Live UPSC Updates</span>
              </h1>
              <button
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="shrink-0 p-2.5 rounded-xl bg-secondary/60 border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-all disabled:opacity-40 mb-4"
                title="Refresh News"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Real-time curated news, editorials, and analysis for your IAS preparation.
            </p>
          </motion.div>

          {/* Tab switcher */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-xl bg-secondary/50 p-1 gap-1">
              <button
                onClick={() => setActiveTab("news")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  activeTab === "news"
                    ? "bg-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--gold)/0.2)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Live News
              </button>
              <button
                onClick={() => setActiveTab("morning")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  activeTab === "morning"
                    ? "bg-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--gold)/0.2)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sun className="w-4 h-4" />
                Morning Digest
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "morning" ? (
              <motion.div
                key="morning"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="max-w-3xl mx-auto glass-card p-6 sm:p-8"
              >
                <div className="flex items-center gap-3 mb-5">
                  <Sun className="w-5 h-5 text-primary" />
                  <h2 className="font-serif text-xl font-bold gold-gradient-text">Morning Digest</h2>
                </div>
                <MorningDigest />
              </motion.div>
            ) : (
              <motion.div
                key="news"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                {/* News Source Selector */}
                <div className="max-w-4xl mx-auto mb-6">
                  <div className="glass-card p-4 sm:p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Select News Source</p>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <Select value={selectedSource} onValueChange={(v) => setSelectedSource(v as NewsSourceId)}>
                        <SelectTrigger className="flex-1 bg-secondary/60 border-border text-foreground h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {NEWS_SOURCES.map((src) => (
                            <SelectItem key={src.id} value={src.id}>
                              {src.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={handleFetchBySource}
                        disabled={sourceFetching}
                        className="h-11 px-6 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shrink-0"
                      >
                        {sourceFetching ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Fetching…
                          </>
                        ) : (
                          "Fetch News"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {sourceFetching ? (
                  <div className="max-w-3xl mx-auto">
                    <ShimmerHero />
                  </div>
                ) : displayedNews.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-card p-6 max-w-3xl mx-auto text-center"
                  >
                    <p className="text-muted-foreground">Select a news source above and click <span className="text-primary font-semibold">Fetch News</span> to load articles.</p>
                  </motion.div>
                ) : (
                  <div className="max-w-4xl mx-auto space-y-4">
                    {sourceNews && (
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <Newspaper className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground">
                          {NEWS_SOURCES.find((s) => s.id === selectedSource)?.label}
                        </span>
                        <span className="text-xs text-muted-foreground">— {displayedNews.length} articles</span>
                      </div>
                    )}
                    {displayedNews.map((item, index) => {
                      const isSaved = savedHeadlines.has(item.headline);
                      return (
                        <motion.article
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 + 0.3, duration: 0.4 }}
                          className="glass-card-hover overflow-hidden"
                        >
                          <div className="p-6 sm:p-8">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold uppercase tracking-wide">
                                  <Tag className="w-3 h-3" />
                                  {item.gs_tag || "General Studies"}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-foreground text-[10px] font-semibold tracking-wide border border-border">
                                  {parseSyllabusBadge(item.gs_tag)}
                                </span>
                                {item.date && (
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    {item.date}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveNews(item, index);
                                }}
                                disabled={savingIndex === index}
                                className={`shrink-0 p-2 rounded-lg transition-all duration-200 ${
                                  isSaved
                                    ? "text-primary bg-primary/15 hover:bg-primary/25"
                                    : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                                }`}
                                title={isSaved ? "Remove from Archive" : "Save to Archive"}
                              >
                                {savingIndex === index ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <Bookmark className={`w-5 h-5 ${isSaved ? "fill-primary" : ""}`} />
                                )}
                              </button>
                            </div>
                            <div
                              className="cursor-pointer"
                              onClick={() => setExpandedItem(expandedItem === index ? null : index)}
                            >
                              <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground mb-3 flex items-start gap-3">
                                <Newspaper className="w-5 h-5 text-primary mt-1 shrink-0" />
                                {item.headline}
                              </h2>
                              <p className="text-muted-foreground leading-relaxed pl-8">
                                {item.summary}
                              </p>
                              <button className="mt-3 ml-8 text-xs text-primary hover:underline transition-colors">
                                {expandedItem === index ? "Hide Mains Practice ↑" : "Open Mains Practice ↓"}
                              </button>
                            </div>
                          </div>
                          <AnimatePresence>
                            {expandedItem === index && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.35 }}
                                className="overflow-hidden"
                              >
                                <div className="px-6 sm:px-8 pb-6">
                                  <MainsPractice headline={item.headline} gsTag={item.gs_tag} />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.article>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Video Feed Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-2">
            <span className="gold-gradient-text">Video Lectures</span>
          </h2>
          <p className="text-muted-foreground mb-8">Curated video content for comprehensive preparation</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videoFeeds.map((video, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="glass-card-hover group cursor-pointer overflow-hidden"
            >
              <div className="relative aspect-video bg-secondary flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                  <Play className="w-6 h-6 text-primary ml-0.5" />
                </div>
                <span className="absolute bottom-2 right-2 bg-background/80 text-xs px-2 py-0.5 rounded text-foreground">
                  {video.duration}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-sm text-foreground mb-1 line-clamp-2">{video.title}</h3>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{video.channel}</span>
                  <span>{video.views} views</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
