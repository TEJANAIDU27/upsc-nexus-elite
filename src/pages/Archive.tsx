import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Newspaper, Tag, Clock, Bookmark, Trash2, Trophy, Brain, ChevronDown, ChevronUp } from "lucide-react";
import { ShimmerCard } from "@/components/ShimmerLoaders";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface SavedNews {
  id: string;
  headline: string;
  summary: string | null;
  gs_tag: string | null;
  date: string | null;
  created_at: string;
}

interface MockTestRecord {
  id: string;
  score: number;
  total_questions: number;
  test_metadata: any;
  created_at: string;
}

export default function Archive() {
  const { user } = useAuth();
  const [savedNews, setSavedNews] = useState<SavedNews[]>([]);
  const [mockTests, setMockTests] = useState<MockTestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"saved" | "tests">("saved");
  const [expandedTest, setExpandedTest] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    Promise.all([
      (supabase
        .from("saved_news") as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      (supabase
        .from("mock_test_history") as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]).then(([newsRes, testsRes]) => {
      if (newsRes.data) setSavedNews(newsRes.data as SavedNews[]);
      if (testsRes.data) setMockTests(testsRes.data as MockTestRecord[]);
      setLoading(false);
    });
  }, [user]);

  const handleRemove = async (id: string) => {
    const { error } = await (supabase.from("saved_news") as any).delete().eq("id", id);
    if (error) {
      toast.error("Failed to remove");
      return;
    }
    setSavedNews((prev) => prev.filter((n) => n.id !== id));
    toast.success("Removed from Archive");
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Please sign in to view your archive.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-serif text-3xl font-bold">
          <span className="gold-gradient-text">My Collections</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Saved news and mock test history</p>
      </motion.div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-8 p-1 rounded-xl bg-secondary/50 w-fit">
        <button
          onClick={() => setActiveTab("saved")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
            activeTab === "saved"
              ? "bg-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--gold)/0.2)]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bookmark className="w-4 h-4" />
          Saved News ({savedNews.length})
        </button>
        <button
          onClick={() => setActiveTab("tests")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
            activeTab === "tests"
              ? "bg-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--gold)/0.2)]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Trophy className="w-4 h-4" />
          Daily Sprints ({mockTests.length})
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <ShimmerCard key={i} className="h-28" />
          ))}
        </div>
      ) : activeTab === "saved" ? (
        savedNews.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Bookmark className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No saved news yet. Bookmark news from the Dashboard.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedNews.map((item, i) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="glass-card-hover p-5 flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Newspaper className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    {item.gs_tag && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold uppercase tracking-wide">
                        <Tag className="w-2.5 h-2.5" />
                        {item.gs_tag}
                      </span>
                    )}
                    {item.date && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="w-2.5 h-2.5" />
                        {item.date}
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif text-base font-semibold text-foreground mb-1">{item.headline}</h3>
                  {item.summary && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.summary}</p>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Remove from Archive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.article>
            ))}
          </div>
        )
      ) : (
        /* Mock Test History */
        mockTests.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Brain className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No sprints taken yet. Try one from the Daily Sprint page.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {mockTests.map((test, i) => {
              const pct = test.total_questions > 0 ? Math.round((test.score / test.total_questions) * 100) : 0;
              const isExpanded = expandedTest === test.id;
              const questions = test.test_metadata?.questions || [];
              const answers = test.test_metadata?.answers || {};
              return (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="glass-card-hover overflow-hidden"
                >
                  <div
                    className="p-5 flex items-center gap-4 cursor-pointer"
                    onClick={() => setExpandedTest(isExpanded ? null : test.id)}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                      pct >= 75 ? "bg-emerald-500/15 text-emerald-400" :
                      pct >= 50 ? "bg-amber-500/15 text-amber-400" :
                      "bg-destructive/15 text-destructive"
                    }`}>
                      {pct}%
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-serif text-base font-semibold text-foreground">
                        Score: {test.score}/{test.total_questions}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {new Date(test.created_at).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                    )}
                  </div>

                  {isExpanded && questions.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="border-t border-border px-5 py-4 space-y-3"
                    >
                      {questions.map((q: any, qi: number) => {
                        const userAnswer = answers[qi];
                        const isCorrect = userAnswer === q.correctAnswer;
                        return (
                          <div key={qi} className="text-sm">
                            <p className="font-medium text-foreground mb-1">
                              Q{qi + 1}. {q.question}
                            </p>
                            <div className="pl-4 text-xs text-muted-foreground space-y-0.5">
                              {userAnswer && !isCorrect && (
                                <p>Your answer: <span className="text-destructive">{userAnswer}</span></p>
                              )}
                              <p>Correct: <span className="text-emerald-400">{q.correctAnswer}</span></p>
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
