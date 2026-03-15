import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChevronRight, ChevronLeft, RotateCcw, Flag, BookOpen, Download, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface RawQuestion {
  test_id?: string;
  subject_category?: string;
  question_text?: string;
  question?: string;
  options: string[] | Record<string, string>;
  correct_option?: string;
  correctAnswer?: string;
  explanation?: string;
  detailedExplanation?: string;
}

interface SimQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  detailedExplanation: string;
  subjectCategory: string;
}

type QStatus = "unvisited" | "answered" | "review";

const STORAGE_KEY = "nexus_prelims_state";
const TOTAL_TIME = 120 * 60; // 120 minutes

function normalizeOptions(options: unknown): string[] {
  if (Array.isArray(options)) return options.map(String);
  if (options && typeof options === "object") {
    return Object.entries(options as Record<string, string>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => `(${key}) ${val}`);
  }
  return [];
}

export default function ExamHall() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<SimQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [reviewFlags, setReviewFlags] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restore from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        if (state.questions?.length > 0 && !state.submitted) {
          setQuestions(state.questions);
          setAnswers(state.answers || {});
          setReviewFlags(new Set(state.reviewFlags || []));
          setTimeLeft(state.timeLeft ?? TOTAL_TIME);
          setCurrentQ(state.currentQ ?? 0);
          setStarted(true);
          setSubmitted(false);
        }
      }
    } catch { /* ignore */ }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (!started || submitted || questions.length === 0) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      questions, answers, reviewFlags: Array.from(reviewFlags), timeLeft, currentQ, submitted: false,
    }));
  }, [questions, answers, reviewFlags, timeLeft, currentQ, started, submitted]);

  // Timer
  useEffect(() => {
    if (!started || submitted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setSubmitted(true);
          localStorage.removeItem(STORAGE_KEY);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [started, submitted]);

  const fetchQuestions = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("https://tejanaidu10.app.n8n.cloud/webhook/nexus_prelims_simulator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user?.email ?? null, user_id: user?.id ?? null }),
    })
      .then((res) => res.json())
      .then((data) => {
        const raw: RawQuestion[] = Array.isArray(data) ? data : data.questions || [];
        const q: SimQuestion[] = raw.map((item) => ({
          question: item.question_text || item.question || "",
          options: normalizeOptions(item.options),
          correctAnswer: item.correct_option || item.correctAnswer || "",
          detailedExplanation: item.explanation || item.detailedExplanation || "",
          subjectCategory: item.subject_category || "",
        }));
        setQuestions(q);
        setStarted(true);
        setCurrentQ(0);
        setAnswers({});
        setReviewFlags(new Set());
        setSubmitted(false);
        setTimeLeft(TOTAL_TIME);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const selectAnswer = (option: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [currentQ]: option }));
  };

  const toggleReview = () => {
    setReviewFlags((prev) => {
      const next = new Set(prev);
      if (next.has(currentQ)) next.delete(currentQ);
      else next.add(currentQ);
      return next;
    });
  };

  const getQStatus = (i: number): QStatus => {
    if (reviewFlags.has(i)) return "review";
    if (answers[i] !== undefined) return "answered";
    return "unvisited";
  };

  // Scoring: +2 correct, -0.66 wrong, 0 unanswered
  const calcScore = () => {
    let correct = 0, wrong = 0, unanswered = 0;
    questions.forEach((q, i) => {
      if (answers[i] === undefined) { unanswered++; return; }
      if (answers[i] === q.correctAnswer) correct++;
      else wrong++;
    });
    const totalMarks = correct * 2 - wrong * 0.66;
    const accuracy = questions.length > 0 ? (correct / (correct + wrong || 1)) * 100 : 0;
    return { correct, wrong, unanswered, totalMarks: Math.round(totalMarks * 100) / 100, accuracy: Math.round(accuracy * 100) / 100 };
  };

  const handleSubmit = () => {
    setSubmitted(true);
    localStorage.removeItem(STORAGE_KEY);
  };

  const generatePDF = () => {
    const { correct, wrong, unanswered, totalMarks, accuracy } = calcScore();
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // Header
    doc.setFontSize(22);
    doc.setTextColor(212, 175, 55);
    doc.text("UPSC Nexus - Prelims Simulator Report", 105, 20, { align: "center" });

    doc.setFontSize(11);
    doc.setTextColor(180, 180, 180);
    doc.text(`Candidate: ${user?.email || "N/A"}`, 14, 35);
    doc.text(`Date: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`, 14, 42);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.text(`Total Marks: ${totalMarks} / ${questions.length * 2}`, 14, 55);
    doc.text(`Accuracy: ${accuracy}%`, 14, 63);
    doc.text(`Correct: ${correct}  |  Wrong: ${wrong}  |  Unanswered: ${unanswered}`, 14, 71);

    doc.setDrawColor(212, 175, 55);
    doc.line(14, 76, 196, 76);

    // Table
    const tableData = questions.map((q, i) => [
      `Q${i + 1}`,
      q.question.length > 80 ? q.question.substring(0, 77) + "..." : q.question,
      answers[i] || "—",
      q.correctAnswer,
      answers[i] === q.correctAnswer ? "✓" : answers[i] ? "✗" : "—",
    ]);

    autoTable(doc, {
      startY: 80,
      head: [["#", "Question", "Your Answer", "Correct", "Result"]],
      body: tableData,
      styles: { fontSize: 7, cellPadding: 2, textColor: [220, 220, 220], fillColor: [12, 20, 39] },
      headStyles: { fillColor: [212, 175, 55], textColor: [5, 10, 24], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [15, 25, 50] },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 80 },
        2: { cellWidth: 35 },
        3: { cellWidth: 35 },
        4: { cellWidth: 15 },
      },
      margin: { left: 14, right: 14 },
    });

    // Detailed explanations on new pages
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(212, 175, 55);
    doc.text("Detailed Explanations", 105, 20, { align: "center" });

    let yPos = 35;
    questions.forEach((q, i) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(9);
      doc.setTextColor(212, 175, 55);
      doc.text(`Q${i + 1}.`, 14, yPos);
      doc.setTextColor(220, 220, 220);
      const qLines = doc.splitTextToSize(q.question, 170);
      doc.text(qLines, 24, yPos);
      yPos += qLines.length * 4 + 2;

      if (q.detailedExplanation) {
        doc.setFontSize(8);
        doc.setTextColor(160, 160, 160);
        const expLines = doc.splitTextToSize(q.detailedExplanation, 165);
        if (yPos + expLines.length * 3.5 > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(expLines, 24, yPos);
        yPos += expLines.length * 3.5 + 6;
      } else {
        yPos += 4;
      }
    });

    doc.save(`UPSC_Nexus_Prelims_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("PDF report downloaded!");
  };

  // ═══════ LANDING STATE ═══════
  if (!started && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-lg"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[hsl(var(--gold-light))] via-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-8 h-8 text-[hsl(var(--navy-deep))]" />
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-4">
            <span className="gold-gradient-text">Nexus Prelims Simulator</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-2">
            100 questions • 120 minutes • UPSC Prelims pattern
          </p>
          <p className="text-muted-foreground text-sm mb-8">
            +2 for correct • −0.66 for wrong • Negative marking applied
          </p>
          {error && <p className="text-destructive text-sm mb-4">{error}</p>}
          <button onClick={fetchQuestions} className="gold-glow-button text-lg">
            Start Simulator
          </button>
        </motion.div>
      </div>
    );
  }

  // ═══════ LOADING ═══════
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[hsl(var(--gold-light))] via-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] flex items-center justify-center animate-pulse">
          <BookOpen className="w-10 h-10 text-[hsl(var(--navy-deep))]" />
        </div>
        <div className="text-center">
          <h2 className="font-serif text-2xl font-bold gold-gradient-text mb-2">UPSC Nexus</h2>
          <p className="text-muted-foreground">Generating your exam paper…</p>
          <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mt-4" />
        </div>
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

  const { correct, wrong, unanswered, totalMarks, accuracy } = calcScore();

  // ═══════ RESULTS ═══════
  if (submitted) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h2 className="font-serif text-3xl font-bold mb-2">
            <span className="gold-gradient-text">Simulator Complete</span>
          </h2>
          <p className="text-5xl font-bold text-foreground my-6">
            {totalMarks} <span className="text-muted-foreground text-2xl">/ {questions.length * 2}</span>
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm mb-6">
            <div className="glass-card px-4 py-3 text-center">
              <p className="text-[hsl(var(--success))] font-bold text-lg">{correct}</p>
              <p className="text-muted-foreground text-xs">Correct</p>
            </div>
            <div className="glass-card px-4 py-3 text-center">
              <p className="text-destructive font-bold text-lg">{wrong}</p>
              <p className="text-muted-foreground text-xs">Wrong</p>
            </div>
            <div className="glass-card px-4 py-3 text-center">
              <p className="text-muted-foreground font-bold text-lg">{unanswered}</p>
              <p className="text-muted-foreground text-xs">Unanswered</p>
            </div>
            <div className="glass-card px-4 py-3 text-center">
              <p className="text-primary font-bold text-lg">{accuracy}%</p>
              <p className="text-muted-foreground text-xs">Accuracy</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={fetchQuestions} className="gold-glow-button inline-flex items-center gap-2 text-sm py-3 px-6">
              <RotateCcw className="w-4 h-4" /> Retake
            </button>
            <button
              onClick={generatePDF}
              className="inline-flex items-center gap-2 text-sm py-3 px-6 rounded-xl border border-primary/30 text-foreground font-semibold hover:border-primary/60 hover:bg-primary/5 transition-all"
            >
              <Download className="w-4 h-4" /> Download Detailed Performance Report
            </button>
          </div>
        </motion.div>

        {/* Review List */}
        <div className="space-y-3">
          {questions.map((q, i) => {
            const isCorrect = answers[i] === q.correctAnswer;
            const isUnanswered = answers[i] === undefined;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.015 }}
                className="glass-card p-5"
              >
                <div className="flex items-start gap-3 mb-2">
                  <span className={`shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isUnanswered ? "bg-muted text-muted-foreground" :
                    isCorrect ? "bg-[hsl(var(--success)/0.2)] text-[hsl(var(--success))]" :
                    "bg-destructive/20 text-destructive"
                  }`}>
                    {i + 1}
                  </span>
                  <p className="text-sm text-foreground font-medium font-serif">{q.question}</p>
                </div>
                <div className="pl-9 text-xs text-muted-foreground space-y-1">
                  {!isUnanswered && !isCorrect && (
                    <p>Your answer: <span className="text-destructive">{answers[i]}</span></p>
                  )}
                  <p>Correct: <span className="text-[hsl(var(--success))]">{q.correctAnswer}</span></p>
                  {q.detailedExplanation && (
                    <p className="mt-1 text-muted-foreground/80">{q.detailedExplanation}</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // ═══════ EXAM UI ═══════
  const currentQuestion = questions[currentQ];
  const answeredCount = Object.keys(answers).length;
  const reviewCount = reviewFlags.size;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 flex flex-col lg:flex-row gap-5">
      {/* Sidebar Navigator */}
      <motion.aside initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:w-72 shrink-0">
        <div className="glass-card p-4 lg:sticky lg:top-20">
          {/* Timer */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Question Navigator</h3>
            <div className="flex items-center gap-1.5 text-sm font-mono">
              <Clock className={`w-4 h-4 ${timeLeft < 300 ? "text-destructive animate-pulse" : "text-primary"}`} />
              <span className={`font-bold ${timeLeft < 300 ? "text-destructive" : "text-foreground"}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-secondary rounded-full mb-3 overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${(answeredCount / questions.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-[10px] mb-3">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-muted border border-border" /> Unvisited</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500/30 border border-blue-500/50" /> Answered</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-500/30 border border-purple-500/50" /> Review</span>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-8 gap-1.5 max-h-[320px] overflow-y-auto pr-1">
            {questions.map((_, i) => {
              const status = getQStatus(i);
              const isCurrent = i === currentQ;
              return (
                <button
                  key={i}
                  onClick={() => setCurrentQ(i)}
                  className={`w-8 h-8 rounded text-[10px] font-semibold transition-all duration-150 border ${
                    isCurrent
                      ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                      : ""
                  } ${
                    status === "review"
                      ? "bg-purple-500/25 text-purple-300 border-purple-500/40"
                      : status === "answered"
                      ? "bg-blue-500/25 text-blue-300 border-blue-500/40"
                      : "bg-muted/50 text-muted-foreground border-border"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          {/* Stats */}
          <div className="flex justify-between text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
            <span>{answeredCount} answered</span>
            <span>{reviewCount} review</span>
            <span>{questions.length - answeredCount} left</span>
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} className="gold-glow-button w-full mt-4 py-3 text-sm">
            Submit Exam
          </button>
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
            transition={{ duration: 0.25 }}
            className="glass-card p-6 sm:p-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold">
                  Question {currentQ + 1} / {questions.length}
                </span>
                {currentQuestion.subjectCategory && (
                  <span className="px-3 py-1 rounded-full bg-accent/15 text-accent-foreground text-xs font-semibold border border-border">
                    {currentQuestion.subjectCategory}
                  </span>
                )}
              </div>
              <button
                onClick={toggleReview}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  reviewFlags.has(currentQ)
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                    : "bg-secondary text-muted-foreground border border-border hover:text-foreground"
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                {reviewFlags.has(currentQ) ? "Marked for Review" : "Mark for Review"}
              </button>
            </div>

            <h2 className="text-lg sm:text-xl font-medium text-foreground mb-8 leading-relaxed font-serif">
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
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              {currentQ < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQ(currentQ + 1)}
                  className="flex items-center gap-1 text-sm text-primary font-medium hover:text-[hsl(var(--gold-light))] transition-colors"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={handleSubmit} className="gold-glow-button text-sm py-2 px-6">
                  Submit Exam
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
