export const ENDPOINTS = {
  DASHBOARD_NEWS: "https://tejanaidu8.app.n8n.cloud/webhook/upsc_dashboard_news",
  MOCK_TEST: "https://tejanaidu8.app.n8n.cloud/webhook/upsc_mock_test_questions",
} as const;

export interface NewsItem {
  headline: string;
  gs_tag: string;
  summary: string;
  date?: string;
}

export interface MockQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  detailedExplanation: string;
}
