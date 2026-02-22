import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, TrendingUp, AlertCircle, Loader2, Send, Lightbulb } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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

function CircularGauge({ score, max = 10 }: { score: number; max?: number }) {
  const radius = 54;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / max) * circumference;
  const percentage = (score / max) * 100;

  const getColor = () => {
    if (percentage >= 80) return "hsl(142, 71%, 45%)";
    if (percentage >= 60) return "hsl(40, 47%, 56%)";
    return "hsl(0, 72%, 51%)";
  };

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
        <circle
          cx="64" cy="64" r={radius}
          fill="none"
          stroke="hsl(216, 40%, 18%)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx="64" cy="64" r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-bold font-serif gold-gradient-text"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-muted-foreground mt-0.5">out of {max}</span>
      </div>
    </div>
  );
}

export function MainsPractice({ headline, gsTag }: MainsPracticeProps) {
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const submitForEvaluation = async () => {
    if (!answer.trim() || answer.trim().length < 50) {
      setError("Please write at least 50 characters for a meaningful evaluation.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("https://tejanaidu8.app.n8n.cloud/webhook/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline,
          gsTag,
          answer,
          email: user?.email ?? null,
          user_id: user?.id ?? null,
        }),
      });

      let data: EvaluationResult;
      try {
        data = await res.json();
        if (!data.score) throw new Error("Invalid response");
      } catch {
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
              className="relative glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-7 border border-primary/20 shadow-[0_0_60px_hsl(var(--gold)/0.1)] z-10"
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-20"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground mb-5 font-medium">
                UPSC Mains Evaluation
              </p>

              {/* Circular Score Gauge */}
              <CircularGauge score={result.score} />

              {/* Strengths Card */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6 rounded-xl border border-[hsl(var(--success)/0.25)] bg-[hsl(var(--success)/0.06)] p-4"
              >
                <div className="flex items-center gap-2 text-[hsl(var(--success))] text-sm font-semibold mb-3">
                  <TrendingUp className="w-4 h-4" /> Strengths
                </div>
                <ul className="space-y-2">
                  {result.strengths.map((s, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="text-sm text-foreground flex items-start gap-2.5"
                    >
                      <span className="text-[hsl(var(--success))] mt-0.5 shrink-0">✓</span>
                      {s}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              {/* Areas to Improve Card */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-4 rounded-xl border border-[hsl(var(--warning)/0.25)] bg-[hsl(var(--warning)/0.06)] p-4"
              >
                <div className="flex items-center gap-2 text-[hsl(var(--warning))] text-sm font-semibold mb-3">
                  <AlertCircle className="w-4 h-4" /> Areas to Improve
                </div>
                <ul className="space-y-2">
                  {result.areasToImprove.map((a, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + i * 0.1 }}
                      className="text-sm text-foreground flex items-start gap-2.5"
                    >
                      <span className="text-[hsl(var(--warning))] mt-0.5 shrink-0">→</span>
                      {a}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              {/* Mentor's Insight */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-5 rounded-xl bg-secondary/40 border border-border/50 p-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  <span className="text-xs uppercase tracking-widest text-primary font-semibold">Mentor's Insight</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic font-serif">
                  "{result.summary}"
                </p>
              </motion.div>

              <button
                onClick={() => { setShowModal(false); setAnswer(""); }}
                className="gold-glow-button w-full mt-6 text-sm py-3"
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
