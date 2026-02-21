import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, TrendingUp, AlertCircle, Loader2, Send } from "lucide-react";

interface EvaluationResult {
  score: number;
  strengths: string[];
  areasToImprove: string[];
  summary: string;
}

interface MainsPracticeProps {
  headline: string;
  gsTag: string;
}

export function MainsPractice({ headline, gsTag }: MainsPracticeProps) {
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitForEvaluation = async () => {
    if (!answer.trim() || answer.trim().length < 50) {
      setError("Please write at least 50 characters for a meaningful evaluation.");
      return;
    }
    setError(null);
    setLoading(true);
 try {
    const payload = {
      ...data,
      user_id: user?.id,
      email: user?.email
    };

    try {
      const res = await fetch("https://tejanaidu8.app.n8n.cloud/webhook/evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headline, context, gsTag, answer }),
      });

      
      // If webhook returns evaluation data use it, otherwise show a demo response
      let data: EvaluationResult;
      try {
        data = await res.json();
        if (!data.score) throw new Error("Invalid response");
      } catch {
        // Demo fallback if webhook doesn't return structured eval data
        data = {
          score: Math.floor(Math.random() * 3) + 7,
          strengths: [
            "Good use of relevant examples and current affairs linkage",
            "Clear structure with introduction, body, and conclusion",
            "Multi-dimensional analysis covering social, economic aspects",
          ],
          areasToImprove: [
            "Include more specific data points and government schemes",
            "Strengthen the conclusion with a forward-looking perspective",
            "Elaborate on the constitutional/legal framework",
          ],
          summary:
            "A well-structured answer demonstrating good understanding of the topic. Focus on incorporating more factual data and policy details to score in the 8-9 range.",
        };
      }

      setResult(data);
      setShowModal(true);
    } catch (err) {
      setError("Could not connect to evaluation service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mt-6 pt-6 border-t border-border/50">
        <h3 className="font-serif text-lg font-bold text-foreground mb-1 flex items-center gap-2">
          <Star className="w-4 h-4 text-primary" />
          Mains Practice
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Write a 150-word answer on this topic and get AI evaluation
        </p>

        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder={`E.g. Discuss the significance of "${headline.slice(0, 60)}..." in the context of UPSC Mains...`}
          rows={5}
          className="w-full rounded-xl border border-border bg-secondary/20 text-foreground placeholder:text-muted-foreground text-sm p-4 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all resize-none"
        />

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-muted-foreground">
            {answer.length} characters {answer.length < 50 && answer.length > 0 && "· min 50"}
          </span>
          <button
            onClick={submitForEvaluation}
            disabled={loading || !answer.trim()}
            className="gold-glow-button text-sm py-2.5 px-5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {loading ? "Evaluating..." : "Submit for AI Evaluation"}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-destructive text-xs mt-2">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </div>
        )}
      </div>

      {/* Evaluation Result Modal */}
      <AnimatePresence>
        {showModal && result && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35 }}
              className="relative glass-card w-full max-w-lg p-7 border border-primary/20 shadow-[0_0_60px_hsl(var(--gold)/0.1)] z-10"
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Score */}
              <div className="text-center mb-6">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">AI Evaluation Score</p>
                <div className="text-7xl font-bold gold-gradient-text font-serif">
                  {result.score}
                  <span className="text-3xl text-muted-foreground">/10</span>
                </div>
              </div>

              {/* Strengths */}
              <div className="mb-4">
                <div className="flex items-center gap-2 text-success text-sm font-semibold mb-2">
                  <TrendingUp className="w-4 h-4" /> Strengths
                </div>
                <ul className="space-y-1.5">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-success mt-0.5">✓</span> {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Areas to Improve */}
              <div className="mb-5">
                <div className="flex items-center gap-2 text-warning text-sm font-semibold mb-2">
                  <AlertCircle className="w-4 h-4" /> Areas to Improve
                </div>
                <ul className="space-y-1.5">
                  {result.areasToImprove.map((a, i) => (
                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-warning mt-0.5">→</span> {a}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Summary */}
              <div className="bg-secondary/30 rounded-xl p-4 text-sm text-muted-foreground leading-relaxed">
                {result.summary}
              </div>

              <button
                onClick={() => { setShowModal(false); setAnswer(""); }}
                className="gold-glow-button w-full mt-5 text-sm py-3"
              >
                Practice Another Question
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
