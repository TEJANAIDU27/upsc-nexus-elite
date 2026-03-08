

## Problem Analysis

There are **two issues** preventing data from showing:

### Issue 1: Wrong Backend Connection (.env file)
The `.env` file was accidentally overwritten to point to a **different backend project** (`rlefqwfkxhjybfzrycbb`) instead of this project's actual backend (`sriqacxwjfldpxrdvvwc`). The component is querying the wrong database entirely.

**Fix:** Restore `.env` to the correct credentials:
- `VITE_SUPABASE_PROJECT_ID="sriqacxwjfldpxrdvvwc"`
- `VITE_SUPABASE_URL="https://sriqacxwjfldpxrdvvwc.supabase.co"`
- Restore the correct anon key

### Issue 2: RLS Policy is Restrictive Instead of Permissive
The `morning_digest` table has a SELECT policy marked as **RESTRICTIVE** (`Permissive: No`). In the database's RLS system, you need at least one **permissive** policy to grant access. A restrictive policy alone (even with `USING (true)`) does not grant access -- it only additionally filters rows that were already permitted by a permissive policy. Since there is no permissive SELECT policy, **zero rows are returned**.

**Fix:** Drop the current restrictive policy and recreate it as a **permissive** policy:
```sql
DROP POLICY "Allow public read access" ON public.morning_digest;
CREATE POLICY "Allow public read access"
  ON public.morning_digest
  FOR SELECT
  TO anon, authenticated
  USING (true);
```

### Issue 3 (Minor): Timezone mismatch potential
The `created_at` column is `timestamp with time zone`. The current filter uses `getTodayISO()` which gets the local date. If the database stores UTC timestamps but the user's browser is in a different timezone (e.g., IST = UTC+5:30), items created on "2026-03-08" UTC could fall outside the local date range. This is less likely the primary issue but worth noting.

**No component code changes needed** -- the `MorningDigest.tsx` logic is correct. The fixes are purely at the infrastructure/config level.

## Steps
1. Restore `.env` to the correct Lovable Cloud backend credentials
2. Run a database migration to fix the RLS policy from restrictive to permissive

