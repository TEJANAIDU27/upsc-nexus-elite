import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Newspaper, Tag, Clock, RefreshCw } from "lucide-react";
import { ShimmerCard } from "@/components/ShimmerLoaders";
import { ENDPOINTS, type NewsItem } from "@/lib/api";

export default function Archive() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = () => {
    setLoading(true);
    fetch(ENDPOINTS.DASHBOARD_NEWS)
      .then((res) => res.json())
      .then((data) => {
        const items = Array.isArray(data) ? data : [data];
        setNews(items);
      })
      .catch(() => setNews([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchNews(); }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="font-serif text-3xl font-bold">
            <span className="gold-gradient-text">News Archive</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Past updates and editorials</p>
        </div>
        <button
          onClick={fetchNews}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </motion.div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <ShimmerCard key={i} className="h-28" />
          ))}
        </div>
      ) : news.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-muted-foreground">No archived news available.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {news.map((item, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass-card-hover p-5 flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Newspaper className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold uppercase tracking-wide">
                    <Tag className="w-2.5 h-2.5" />
                    {item.gs_tag || "GS"}
                  </span>
                  {item.date && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="w-2.5 h-2.5" />
                      {item.date}
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-base font-semibold text-foreground mb-1">{item.headline}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{item.summary}</p>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}
