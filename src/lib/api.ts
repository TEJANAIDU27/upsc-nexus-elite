export const ENDPOINTS = {
  DASHBOARD_NEWS: "https://tejanaidu8.app.n8n.cloud/webhook/upsc_dashboard_news",
  MOCK_TEST: "https://tejanaidu8.app.n8n.cloud/webhook/upsc_mock_test_questions",
} as const;

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
