
CREATE TABLE public.prelims_ultimate_mock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id text,
  subject_category text,
  question_text text,
  options jsonb,
  correct_option text,
  explanation text
);

ALTER TABLE public.prelims_ultimate_mock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.prelims_ultimate_mock
  FOR SELECT TO anon, authenticated USING (true);
