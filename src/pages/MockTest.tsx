import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChevronRight, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { ShimmerQuestion } from "@/components/ShimmerLoaders";
import { ENDPOINTS, type MockQuestion } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function MockTest() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(20 * 60);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savedRef = useRef(false);

  // Normalize options: webhook may return { a: "...", b: "...", c: "...", d: "..." }
  // or an array of strings — we convert both into a string[]
  const normalizeOptions = (options: unknown): string[] => {
    if (Array.isArray(options)) return options.map(String);
    if (options && typeof options === "object") {
      return Object.entries(options as Record<string, string>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, val]) => `(${key}) ${val}`);
    }
    return [];
  };

  const fetchQuestions = useCallback(() => {
    setLoading(true);
    setError(null);
    savedRef.current = false;
    fetch(ENDPOINTS.MOCK_TEST, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user?.email ?? null,
        user_id: user?.id ?? null,
        gs_tag: null,
        answer: null,
        headline: null,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        const raw: MockQuestion[] = Array.isArray(data) ? data : data.questions || [];
        const q = raw.slice(0, 20).map((item) => ({
          ...item,
          options: normalizeOptions(item.options),
        }));
        setQuestions(q);
        setStarted(true);
        setCurrentQ(0);
        setAnswers({});
        setSubmitted(false);
        setTimeLeft(20 * 60);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  // Timer
  useEffect(() => {
    if (!started || submitted || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setSubmitted(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [started, submitted, timeLeft]);

  // Save results to database on submission
  useEffect(() => {
    if (!submitted || !user || savedRef.current || questions.length === 0) return;
    savedRef.current = true;
    const finalScore = questions.reduce(
      (acc, q, i) => acc + (answers[i] === q.correctAnswer ? 1 : 0),
      0
    );
    (supabase
      .from("mock_test_history") as any)
      .insert({
        user_id: user.id,
        score: finalScore,
        total_questions: questions.length,
        test_metadata: { questions, answers },
      })
      .then(({ error }) => {
        if (error) {
          console.error("Failed to save test:", error);
        } else {
          toast.success("Test results saved to your Archive");
        }
      });
  }, [submitted, user, questions, answers]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const selectAnswer = (option: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [currentQ]: option }));
  };

  const score = questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.correctAnswer ? 1 : 0),
    0
  );

  const progress = questions.length > 0
    ? (Object.keys(answers).length / questions.length) * 100
    : 0;

  // Landing state
  if (!started && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-lg"
        >
          <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-4">
            <span className="gold-gradient-text">Daily Sprint</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            20 questions • 20 minutes • UPSC Prelims pattern
          </p>
          {error && <p className="text-destructive text-sm mb-4">{error}</p>}
          <button onClick={fetchQuestions} className="gold-glow-button text-lg">
            Generate a Mock Test
          </button>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4">
        <ShimmerQuestion />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No questions available. Please try again.</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQ];

  // Results
  if (submitted) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h2 className="font-serif text-3xl font-bold mb-2">
            <span className="gold-gradient-text">Test Complete</span>
          </h2>
          <p className="text-5xl font-bold text-foreground my-6">
            {score} <span className="text-muted-foreground text-2xl">/ {questions.length}</span>
          </p>
          <p className="text-muted-foreground mb-6">
            {score >= 15 ? "Excellent!" : score >= 10 ? "Good effort!" : "Keep practicing!"}
          </p>
          <button onClick={fetchQuestions} className="gold-glow-button inline-flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Retake Test
          </button>
        </motion.div>

        <div className="space-y-4">
          {questions.map((q, i) => {
            const isCorrect = answers[i] === q.correctAnswer;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass-card p-5"
              >
                <div className="flex items-start gap-3 mb-3">
                  {answers[i] ? (
                    isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    )
                  ) : (
                    <span className="w-5 h-5 rounded-full border border-muted-foreground shrink-0 mt-0.5" />
                  )}
                  <p className="text-sm text-foreground font-medium">
                    Q{i + 1}. {q.question}
                  </p>
                </div>
                <div className="pl-8 text-xs text-muted-foreground space-y-1">
                  {answers[i] && !isCorrect && (
                    <p>Your answer: <span className="text-destructive">{answers[i]}</span></p>
                  )}
                  <p>Correct: <span className="text-success">{q.correctAnswer}</span></p>
                  {q.detailedExplanation && (
                    <p className="mt-1 text-muted-foreground">{q.detailedExplanation}</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // Quiz UI
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 flex flex-col lg:flex-row gap-6">
      {/* Question Navigator Sidebar */}
      <motion.aside
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="lg:w-64 shrink-0"
      >
        <div className="glass-card p-4 lg:sticky lg:top-24">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Questions</h3>
            <div className="flex items-center gap-1.5 text-sm font-mono">
              <Clock className={`w-4 h-4 ${timeLeft < 120 ? "text-destructive" : "text-primary"}`} />
              <span className={timeLeft < 120 ? "text-destructive" : "text-foreground"}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-secondary rounded-full mb-4 overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                className={
                  i === currentQ
                    ? "question-nav-btn-active"
                    : answers[i] !== undefined
                    ? "question-nav-btn-answered"
                    : "question-nav-btn-default"
                }
              >
                {i + 1}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            {Object.keys(answers).length} of {questions.length} answered
          </p>
        </div>
      </motion.aside>

      {/* Question Area */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-6 sm:p-8"
          >
            <div className="flex items-center gap-2 mb-6">
              <span className="px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold">
                Question {currentQ + 1}/{questions.length}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-medium text-foreground mb-8 leading-relaxed">
              {currentQuestion.question}
            </h2>
            <div className="space-y-3">
              {currentQuestion.options?.map((option, oi) => {
                const isSelected = answers[currentQ] === option;
                return (
                  <motion.button
                    key={oi}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => selectAnswer(option)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? "border-primary bg-primary/10 text-foreground shadow-[0_0_15px_hsl(var(--gold)/0.15)]"
                        : "border-border bg-secondary/30 text-foreground hover:border-primary/30 hover:bg-secondary/60"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span className="text-sm">{option}</span>
                    </span>
                  </motion.button>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <button
                onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                disabled={currentQ === 0}
                className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              >
                ← Previous
              </button>
              {currentQ < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQ(currentQ + 1)}
                  className="flex items-center gap-1 text-sm text-primary font-medium hover:text-gold-light transition-colors"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setSubmitted(true)}
                  className="gold-glow-button text-sm py-2 px-6"
                >
                  Submit Test
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
