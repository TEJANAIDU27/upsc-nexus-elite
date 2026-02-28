import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { ENDPOINTS, normalizeNewsItems, type NewsItem } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface NewsContextType {
  news: NewsItem[];
  loading: boolean;
  error: string | null;
  fetchNews: (force?: boolean) => void;
}

const NewsContext = createContext<NewsContextType>({
  news: [],
  loading: true,
  error: null,
  fetchNews: () => {},
});

export function NewsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchNews = useCallback(
    async (force = false) => {
      if (hasFetched && !force) return;
      setLoading(true);
      setError(null);

      // Try cache first (unless forced refresh)
      if (!force && user) {
        try {
          const { data: cached } = await (supabase.from("dashboard_cache") as any)
            .select("news_data, updated_at")
            .eq("user_id", user.id)
            .maybeSingle();

          if (cached?.news_data && Array.isArray(cached.news_data) && cached.news_data.length > 0) {
            setNews(cached.news_data);
            setLoading(false);
            setHasFetched(true);
            return;
          }
        } catch {
          // ignore cache miss
        }
      }

      // Fetch from webhook
      try {
        const res = await fetch(ENDPOINTS.DASHBOARD_NEWS, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user?.email ?? null,
            user_id: user?.id ?? null,
          }),
        });
        const data = await res.json();
        const items: NewsItem[] = normalizeNewsItems(data);
        setNews(items);
        setHasFetched(true);

        // Persist to cache
        if (user) {
          await (supabase.from("dashboard_cache") as any).upsert(
            { user_id: user.id, news_data: items, updated_at: new Date().toISOString() },
            { onConflict: "user_id" }
          );
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [user, hasFetched]
  );

  return (
    <NewsContext.Provider value={{ news, loading, error, fetchNews }}>
      {children}
    </NewsContext.Provider>
  );
}

export const useNews = () => useContext(NewsContext);
