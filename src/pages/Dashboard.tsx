import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Newspaper, Tag, Clock, Play, TrendingUp, Users, Award } from "lucide-react";
import { ShimmerHero, ShimmerCard } from "@/components/ShimmerLoaders";
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

export default function Dashboard() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
              <AnimatePresence>
                {news.map((item, index) => (
                  <motion.article
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.4 }}
                    className="glass-card-hover p-6 sm:p-8"
                  >
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold uppercase tracking-wide">
                        <Tag className="w-3 h-3" />
                        {item.gs_tag || "General Studies"}
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
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
          )}
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
