import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Brain, CheckCircle, XCircle, BookOpen, RefreshCw } from "lucide-react";

interface Flashcard {
  id: number;
  concept: string;
  yourAnswer: string;
  correctAnswer: string;
  topic: string;
  flipped: boolean;
}

// Mock data for demo — in production these would come from stored wrong answers
const mockWrongAnswers: Omit<Flashcard, "flipped">[] = [
  {
    id: 1,
    concept: "Preamble of the Indian Constitution",
    yourAnswer: "Secular was in the original Preamble",
    correctAnswer:
      "The words 'Socialist', 'Secular', and 'Integrity' were added by the 42nd Constitutional Amendment (1976) via the Swaran Singh Committee. The original 1949 Preamble did not contain these words.",
    topic: "GS2: Polity",
  },
  {
    id: 2,
    concept: "Bharat Stage VI Emission Norms",
    yourAnswer: "Implemented in 2022",
    correctAnswer:
      "India leapfrogged directly from BS-IV to BS-VI emission norms in April 2020, skipping BS-V entirely. This was done to bring India in line with Euro-VI standards and reduce vehicular pollution.",
    topic: "GS3: Environment",
  },
  {
    id: 3,
    concept: "Purchasing Power Parity (PPP)",
    yourAnswer: "Rate at which central banks exchange currency",
    correctAnswer:
      "PPP is an economic theory that compares different countries' currencies through a 'basket of goods' approach. It calculates how much a currency must be exchanged to buy the same goods/services in another country.",
    topic: "GS3: Economy",
  },
  {
    id: 4,
    concept: "PM POSHAN Scheme",
    yourAnswer: "Scheme for senior citizens",
    correctAnswer:
      "PM POSHAN (formerly Mid-Day Meal Scheme) provides one hot cooked meal to children in government and government-aided schools, Classes I to VIII. It is the world's largest school feeding programme.",
    topic: "GS2: Governance",
  },
  {
    id: 5,
    concept: "Tropic of Cancer",
    yourAnswer: "Passes through 7 Indian states",
    correctAnswer:
      "The Tropic of Cancer (23.5°N) passes through 8 Indian states: Gujarat, Rajasthan, Madhya Pradesh, Chhattisgarh, Jharkhand, West Bengal, Tripura, and Mizoram.",
    topic: "GS1: Geography",
  },
  {
    id: 6,
    concept: "Doctrine of Lapse",
    yourAnswer: "Introduced by Lord Curzon",
    correctAnswer:
      "The Doctrine of Lapse was introduced by Lord Dalhousie (1848-1856). It allowed the British East India Company to annex princely states if the ruler died without a natural male heir. Satara (1848) was the first state annexed under this doctrine.",
    topic: "GS1: Modern History",
  },
];

export default function RevisionDashboard() {
  const [cards, setCards] = useState<Flashcard[]>(
    mockWrongAnswers.map((c) => ({ ...c, flipped: false }))
  );
  const [filter, setFilter] = useState<string>("All");
  const [mastered, setMastered] = useState<Set<number>>(new Set());

  const topics = ["All", ...Array.from(new Set(mockWrongAnswers.map((c) => c.topic)))];

  const filteredCards = cards.filter(
    (c) => (filter === "All" || c.topic === filter) && !mastered.has(c.id)
  );

  const flipCard = (id: number) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, flipped: !c.flipped } : c))
    );
  };

  const markMastered = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setMastered((prev) => new Set([...prev, id]));
  };

  const resetMastered = () => setMastered(new Set());

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="font-serif text-3xl font-bold">
            <span className="gold-gradient-text">Revision Dashboard</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Flip cards to reveal explanations · Mark mastered to track progress
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Brain className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">{mastered.size}</span> mastered
          </div>
          {mastered.size > 0 && (
            <button
              onClick={resetMastered}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>
      </motion.div>

      {/* Topic Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {topics.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
              filter === t
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Flashcard Grid */}
      {filteredCards.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-12 text-center"
        >
          <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
          <h3 className="font-serif text-xl font-bold mb-2">All Mastered!</h3>
          <p className="text-muted-foreground text-sm mb-6">
            You've mastered all concepts in this filter.
          </p>
          <button onClick={resetMastered} className="gold-glow-button text-sm py-2.5 px-6 inline-flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Start Over
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCards.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="cursor-pointer group"
              style={{ perspective: "1000px" }}
              onClick={() => flipCard(card.id)}
            >
              <div
                className="relative w-full transition-transform duration-700"
                style={{
                  transformStyle: "preserve-3d",
                  transform: card.flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  minHeight: "220px",
                }}
              >
                {/* Front */}
                <div
                  className="absolute inset-0 glass-card p-5 flex flex-col justify-between"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold uppercase tracking-wide mb-3">
                      {card.topic}
                    </span>
                    <h3 className="font-serif font-bold text-foreground text-base leading-snug">
                      {card.concept}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                      <XCircle className="w-3.5 h-3.5 inline text-destructive mr-1" />
                      Your answer: {card.yourAnswer}
                    </p>
                  </div>
                  <p className="text-xs text-primary mt-4 group-hover:underline">
                    Tap to reveal explanation →
                  </p>
                </div>

                {/* Back */}
                <div
                  className="absolute inset-0 glass-card p-5 flex flex-col justify-between border-primary/20"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    background: "hsl(var(--card))",
                  }}
                >
                  <div>
                    <span className="inline-flex items-center gap-1 text-success text-[10px] font-semibold uppercase tracking-wide mb-3">
                      <CheckCircle className="w-3 h-3" /> Correct Answer
                    </span>
                    <p className="text-sm text-foreground leading-relaxed">
                      {card.correctAnswer}
                    </p>
                  </div>
                  <button
                    onClick={(e) => markMastered(card.id, e)}
                    className="mt-4 text-xs flex items-center gap-1.5 text-success hover:text-success/80 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Mark as Mastered
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
