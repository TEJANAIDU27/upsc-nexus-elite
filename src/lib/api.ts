export const ENDPOINTS = {
  DASHBOARD_NEWS: "https://tejanaidu7.app.n8n.cloud/webhook/upsc_dashboard_news",
  MOCK_TEST: "https://tejanaidu7.app.n8n.cloud/webhook/upsc_mock test_questions",
} as const;

export interface NewsItem {
  headline: string;
  gs_tag: string;
  summary: string;
  date?: string;
}

export interface MockQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: string;
}
