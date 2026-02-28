
-- Cache table for dashboard news to avoid redundant webhook calls
CREATE TABLE public.dashboard_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  news_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- One cache row per user
CREATE UNIQUE INDEX idx_dashboard_cache_user ON public.dashboard_cache (user_id);

ALTER TABLE public.dashboard_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cache"
  ON public.dashboard_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cache"
  ON public.dashboard_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cache"
  ON public.dashboard_cache FOR UPDATE
  USING (auth.uid() = user_id);
