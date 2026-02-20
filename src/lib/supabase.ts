import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://rlefqwfkxhjybfzrycbb.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZWZxd2ZreGhqeWJmenJ5Y2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1OTYwNDgsImV4cCI6MjA4NzE3MjA0OH0.3shFowVsdQJNLuLwZQ2BK2YGGleY8BST__YEZKJOFK0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
