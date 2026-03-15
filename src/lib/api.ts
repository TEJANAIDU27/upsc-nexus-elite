export const ENDPOINTS = {
  DASHBOARD_NEWS: "https://n8n.srv1495892.hstgr.cloud/webhook/upsc_dashboard_news",
  MOCK_TEST: "https://tejanaidu10.app.n8n.cloud/webhook/upsc_mock_test_questions",
} as const;

export const NEWS_SOURCES = [
  { id: "economic-times", label: "Economic Times", endpoint: "https://n8n.srv1495892.hstgr.cloud/webhook/upsc_dashboard_news_econimic_times" },
  { id: "the-hindu", label: "The Hindu", endpoint: "https://n8n.srv1495892.hstgr.cloud/webhook/upsc_dashboard_news_hindu" },
  { id: "times-of-india", label: "Times of India", endpoint: "https://n8n.srv1495892.hstgr.cloud/webhook/upsc_dashboard_news_times_of_india" },
  { id: "bbc", label: "BBC", endpoint: "https://n8n.srv1495892.hstgr.cloud/webhook/upsc_dashboard_news_bbc" },
] as const;

export type NewsSourceId = typeof NEWS_SOURCES[number]["id"];

export interface NewsItem {
  headline: string;
  gs_tag: string;
  summary: string;
  date?: string;
  mains_question?: string;
}

/** Raw shape returned by the n8n webhook */
export interface RawNewsItem {
  title: string;
  content: string;
  gs_paper: string;
  mains_question?: string;
  created_at?: string;
}

/** Normalise webhook payload into internal NewsItem */
export function normalizeNewsItems(data: unknown): NewsItem[] {
  const arr = Array.isArray(data) ? data : [data];
  return arr.map((item: any) => ({
    headline: item.title ?? item.headline ?? "",
    summary: item.content ?? item.summary ?? "",
    gs_tag: item.gs_paper ?? item.gs_tag ?? "General Studies",
    date: item.created_at
      ? new Date(item.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      : item.date ?? undefined,
    mains_question: item.mains_question ?? undefined,
  }));
}

export interface MockQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  detailedExplanation: string;
}
