

## Problem Analysis

There are **two issues**:

### Issue 1: `.env` is wrong AGAIN
The `.env` file has been overwritten to point to the wrong backend (`rlefqwfkxhjybfzrycbb` instead of `sriqacxwjfldpxrdvvwc`). This breaks authentication and all database features (Morning Digest, etc.). Must be restored.

### Issue 2: Exam Hall webhook response parsing
Looking at the webhook response in the screenshot, the data comes as a flat JSON array:
```json
[
  {
    "test_id": "NEXUS_GS_ULTIMATE_01",
    "subject_category": "Indian Polity - Political Parties",
    "question_text": "The allegation of a 'tacit agreement'...",
    "options": ["A. The independence...", "B. The equitable...", ...],
    "correct_option": "C. The principles of multi-party competition...",
    "explanation": "A 'tacit agreement'..."
  },
  ...
]
```

The current parsing code at line 110 looks correct for this format. The likely issue is that the webhook might return the data wrapped differently (e.g., `{ output: [...] }` or as a string), or CORS could be blocking the request silently.

**Fix approach**: Add robust response handling with:
1. Better logging/error handling to capture the actual response shape
2. Handle multiple wrapper formats: `data`, `data.output`, `data[0].output`, stringified JSON
3. Add a `console.log` of the raw response for debugging
4. Also handle the case where the webhook returns `question_text` with `\n` newlines (visible in the screenshot) — render them properly

## Steps

1. **Restore `.env`** to the correct Lovable Cloud credentials (`sriqacxwjfldpxrdvvwc`)
2. **Harden `fetchQuestions`** in `ExamHall.tsx`:
   - Log raw response data for debugging
   - Try multiple extraction paths: `data`, `data.output`, `data.questions`, `data[0]` (n8n sometimes wraps in an extra array)
   - Handle stringified JSON responses
   - Render `\n` in question text as line breaks

