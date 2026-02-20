import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Newspaper, Tag, Clock, Play, TrendingUp, Users, Award, Sun, LayoutGrid } from "lucide-react";
import { ShimmerHero, ShimmerCard } from "@/components/ShimmerLoaders";
import { MorningDigest } from "@/components/MorningDigest";
import { MainsPractice } from "@/components/MainsPractice";
import { ENDPOINTS, type NewsItem } from "@/lib/api";
import heroBg from "@/assets/hero-bg.jpg";

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

// Parse GS tag to derive syllabus topic badge
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
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("news");
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  useEffect(() => {
    fetch(ENDPOINTS.DASHBOARD_NEWS)
      .then((res) => res.json())
      .then((data) => {
        const items = Array.isArray(data) ? data : [data];
        setNews(items);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

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
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
              <span className="gold-gradient-text">Live UPSC Updates</span>
            </h1>
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
                {/* News Cards */}
                {loading ? (
                  <div className="max-w-3xl mx-auto">
                    <ShimmerHero />
                  </div>
                ) : error ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-card p-6 max-w-3xl mx-auto text-center"
                  >
                    <p className="text-muted-foreground">Unable to load news. Please try again later.</p>
                  </motion.div>
                ) : (
                  <div className="max-w-4xl mx-auto space-y-4">
                    {news.map((item, index) => (
                      <motion.article
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 + 0.3, duration: 0.4 }}
                        className="glass-card-hover overflow-hidden"
                      >
                        <div
                          className="p-6 sm:p-8 cursor-pointer"
                          onClick={() => setExpandedItem(expandedItem === index ? null : index)}
                        >
                          {/* Badges row */}
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold uppercase tracking-wide">
                              <Tag className="w-3 h-3" />
                              {item.gs_tag || "General Studies"}
                            </span>
                            {/* Syllabus topic badge */}
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

                        {/* Mains Practice expandable */}
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
                    ))}
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
