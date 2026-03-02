
-- Saved news / archive table
CREATE TABLE public.saved_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  headline TEXT NOT NULL,
  summary TEXT,
  gs_tag TEXT,
  date TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved news" ON public.saved_news FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved news" ON public.saved_news FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved news" ON public.saved_news FOR DELETE USING (auth.uid() = user_id);

-- Unique constraint to prevent duplicate saves
CREATE UNIQUE INDEX idx_saved_news_unique ON public.saved_news (user_id, headline);

-- Mock test history table
CREATE TABLE public.mock_test_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  score NUMERIC NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  test_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mock_test_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mock tests" ON public.mock_test_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mock tests" ON public.mock_test_history FOR INSERT WITH CHECK (auth.uid() = user_id);
