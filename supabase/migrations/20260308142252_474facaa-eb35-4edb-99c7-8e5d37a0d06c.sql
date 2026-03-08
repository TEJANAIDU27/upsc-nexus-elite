DROP POLICY IF EXISTS "Allow public read access" ON public.morning_digest;
CREATE POLICY "Allow public read access"
  ON public.morning_digest
  FOR SELECT
  TO anon, authenticated
  USING (true);