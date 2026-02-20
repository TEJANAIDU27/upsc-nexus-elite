import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Shield, TrendingUp, Users, Award, ChevronRight, Zap, Target, Star } from "lucide-react";

const quotes = [
  "The price of greatness is responsibility.",
  "I am an Indian and I have every right in this country but with certain duties.",
  "Service to man is service to God.",
  "The future belongs to those who prepare for it today.",
  "Civil service is not a career — it is a calling.",
  "Arise, awake and stop not until the goal is reached.",
];

const features = [
  {
    icon: Zap,
    title: "Live News Feed",
    description: "Real-time UPSC-curated news with GS tags, synced from PIB, The Hindu & AIR.",
  },
  {
    icon: Target,
    title: "AI Mock Tests",
    description: "20-question UPSC Prelims pattern tests generated live. Instant scoring & deep explanations.",
  },
  {
    icon: Shield,
    title: "Mains Practice",
    description: "Write mains answers, get AI-evaluated scores with Strengths & Areas to Improve.",
  },
  {
    icon: Star,
    title: "Revision Flashcards",
    description: "Auto-generated flashcards from your wrong answers. Spaced repetition built-in.",
  },
];

const stats = [
  { icon: Users, label: "Active Aspirants", value: "50,000+" },
  { icon: Award, label: "Selections", value: "1,200+" },
  { icon: TrendingUp, label: "Success Rate", value: "78%" },
];

function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setDisplayed("");
    setIdx(0);
  }, [text]);

  useEffect(() => {
    if (idx < text.length) {
      const t = setTimeout(() => {
        setDisplayed((p) => p + text[idx]);
        setIdx((i) => i + 1);
      }, 38);
      return () => clearTimeout(t);
    }
  }, [idx, text]);

  return (
    <span>
      {displayed}
      <span className="animate-pulse text-primary">|</span>
    </span>
  );
}

export default function LandingPage() {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  const cycleQuote = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setQuoteIndex((i) => (i + 1) % quotes.length);
      setVisible(true);
    }, 600);
  }, []);

  useEffect(() => {
    const interval = setInterval(cycleQuote, 5000);
    return () => clearInterval(interval);
  }, [cycleQuote]);

  return (
    <div className="min-h-screen">
      {/* ─── Hero ─── */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-4 overflow-hidden">
        {/* Background glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-primary/8 blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl w-full mx-auto text-center z-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest mb-8"
          >
            <BookOpen className="w-3.5 h-3.5" />
            India's Premier IAS Preparation Platform
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6"
          >
            Transforming{" "}
            <span className="gold-gradient-text">Aspirants</span>
            <br />
            into{" "}
            <span className="gold-gradient-text">Officers.</span>
          </motion.h1>

          {/* Typewriter sub-headline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-muted-foreground text-xl sm:text-2xl mb-10 font-light min-h-[2em]"
          >
            The Civil Servant's{" "}
            <span className="text-foreground font-medium">
              <TypewriterText text="Digital Command Centre." />
            </span>
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
          >
            <Link to="/auth" className="gold-glow-button text-base flex items-center gap-2">
              Get Started Free <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              to="/dashboard"
              className="px-8 py-4 rounded-xl border border-primary/30 text-foreground text-base font-semibold hover:border-primary/60 hover:bg-primary/5 transition-all duration-300"
            >
              Explore Dashboard
            </Link>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex flex-wrap justify-center gap-8"
          >
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-2 text-sm">
                <s.icon className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">{s.label}:</span>
                <span className="font-bold text-foreground">{s.value}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
        >
          <span className="text-xs text-muted-foreground uppercase tracking-widest">Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-0.5 h-6 bg-primary/40 rounded-full"
          />
        </motion.div>
      </section>

      {/* ─── Blip Quote Section ─── */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/3 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs uppercase tracking-[0.3em] text-primary mb-8 font-semibold"
          >
            Words That Forged Officers
          </motion.p>

          {/* Blip/flicker quote */}
          <div className="relative min-h-[120px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {visible && (
                <motion.blockquote
                  key={quoteIndex}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{
                    opacity: [0, 1, 0.7, 1],
                    scale: 1,
                  }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.6, times: [0, 0.3, 0.6, 1] }}
                  className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold gold-gradient-text leading-relaxed"
                >
                  "{quotes[quoteIndex]}"
                </motion.blockquote>
              )}
            </AnimatePresence>
          </div>

          {/* Quote dots */}
          <div className="flex justify-center gap-2 mt-8">
            {quotes.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setVisible(false);
                  setTimeout(() => {
                    setQuoteIndex(i);
                    setVisible(true);
                  }, 300);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === quoteIndex ? "bg-primary w-6" : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Feature Grid ─── */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-3">
            Everything You Need to{" "}
            <span className="gold-gradient-text">Crack UPSC</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            An integrated, AI-powered ecosystem designed for serious civil service aspirants.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card-hover p-6 flex flex-col gap-4 group"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-foreground mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto glass-card p-12 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none" />
          <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4 relative">
            Your Journey to{" "}
            <span className="gold-gradient-text">Lal Bahadur Bhavan</span>{" "}
            Starts Here.
          </h2>
          <p className="text-muted-foreground mb-8 relative">
            Join 50,000+ aspirants already preparing smarter with UPSC Nexus.
          </p>
          <Link to="/auth" className="gold-glow-button text-base inline-flex items-center gap-2 relative">
            Start Your Preparation <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
