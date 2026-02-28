import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Mic, MicOff, Send, User, MessageSquare, FileText, Loader2, ChevronDown } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const INTERVIEW_WEBHOOK = "https://tejanaidu8.app.n8n.cloud/webhook/interview";

interface InterviewQuestion {
  question: string;
  category?: string;
  follow_up?: string;
}

interface ChatMessage {
  role: "board" | "candidate" | "mentor";
  text: string;
}

export default function InterviewHub() {
  const { user } = useAuth();
  const [dafFile, setDafFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Mock chat state
  const [chatActive, setChatActive] = useState(false);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [sendingAnswer, setSendingAnswer] = useState(false);
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // DAF upload & question fetch
  const handleDAFUpload = async () => {
    if (!dafFile) {
      toast.error("Please select your DAF file first");
      return;
    }
    setLoadingQuestions(true);
    try {
      const formData = new FormData();
      formData.append("file", dafFile);
      formData.append("email", user?.email ?? "");
      formData.append("user_id", user?.id ?? "");

      const res = await fetch(INTERVIEW_WEBHOOK, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      const qs: InterviewQuestion[] = Array.isArray(data) ? data : data.questions || [];
      setQuestions(qs);
      if (qs.length === 0) toast.info("No questions returned. Try a different DAF.");
    } catch (err: any) {
      toast.error(err.message || "Failed to process DAF");
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Start live mock
  const startMock = () => {
    if (questions.length === 0) {
      toast.error("Upload your DAF first to generate questions");
      return;
    }
    setChatActive(true);
    setCurrentQIdx(0);
    setChatMessages([{ role: "board", text: questions[0].question }]);
  };

  // Web Speech API
  const toggleRecording = useCallback(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      toast.error("Speech recognition is not supported in your browser");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript;
      }
      setTranscript(finalTranscript);
    };

    recognition.onerror = () => {
      setIsRecording(false);
      toast.error("Speech recognition error");
    };

    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [isRecording]);

  // Submit answer
  const submitAnswer = async () => {
    const answer = transcript.trim();
    if (!answer) {
      toast.error("Please record or type your answer");
      return;
    }

    setSendingAnswer(true);
    setChatMessages((prev) => [...prev, { role: "candidate", text: answer }]);
    setTranscript("");

    // Send to webhook for feedback
    try {
      const res = await fetch(INTERVIEW_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.email ?? null,
          user_id: user?.id ?? null,
          question: questions[currentQIdx]?.question,
          answer,
          mode: "feedback",
        }),
      });
      const data = await res.json();
      const feedback = typeof data === "string" ? data : data.feedback || data.message || "Good attempt. Keep refining your answer structure.";

      setChatMessages((prev) => [...prev, { role: "mentor", text: feedback }]);

      // Move to next question
      const nextIdx = currentQIdx + 1;
      if (nextIdx < questions.length) {
        setCurrentQIdx(nextIdx);
        setTimeout(() => {
          setChatMessages((prev) => [...prev, { role: "board", text: questions[nextIdx].question }]);
        }, 1200);
      } else {
        setTimeout(() => {
          setChatMessages((prev) => [
            ...prev,
            { role: "board", text: "Thank you. That concludes your interview. You may leave." },
          ]);
        }, 1200);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "mentor", text: "Could not get feedback. Try again." },
      ]);
    } finally {
      setSendingAnswer(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-4xl sm:text-5xl font-bold mb-4"
          >
            <span className="gold-gradient-text">Interview Hub</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            Upload your DAF, get high-probability questions, and practice with a live mock board.
          </motion.p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-10">
        {/* DAF Upload */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-6 sm:p-8"
        >
          <h2 className="font-serif text-xl font-bold gold-gradient-text mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Upload Your DAF
          </h2>
          <div
            className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/40 transition-colors cursor-pointer"
            onClick={() => document.getElementById("daf-input")?.click()}
          >
            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {dafFile ? dafFile.name : "Click to upload your DAF (PDF, DOC, DOCX)"}
            </p>
            <input
              id="daf-input"
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setDafFile(e.target.files?.[0] || null)}
            />
          </div>
          <button
            onClick={handleDAFUpload}
            disabled={loadingQuestions || !dafFile}
            className="gold-glow-button mt-4 text-sm py-2.5 px-6 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {loadingQuestions ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loadingQuestions ? "Processing..." : "Generate Questions"}
          </button>
        </motion.div>

        {/* Question Bank */}
        <AnimatePresence>
          {questions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass-card p-6 sm:p-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-xl font-bold gold-gradient-text flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  High-Probability Question Bank
                </h2>
                <span className="text-xs text-muted-foreground">{questions.length} questions</span>
              </div>
              <Accordion type="single" collapsible className="space-y-2">
                {questions.map((q, i) => (
                  <AccordionItem
                    key={i}
                    value={`q-${i}`}
                    className="glass-card border-border/50 rounded-lg px-4"
                  >
                    <AccordionTrigger className="text-sm text-foreground hover:no-underline py-3">
                      <span className="flex items-center gap-3 text-left">
                        <span className="shrink-0 w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-semibold flex items-center justify-center">
                          {i + 1}
                        </span>
                        {q.question}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground pb-3">
                      {q.category && (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-2">
                          {q.category}
                        </span>
                      )}
                      {q.follow_up && <p className="mt-1">Follow-up: {q.follow_up}</p>}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <button
                onClick={startMock}
                className="gold-glow-button mt-6 text-sm py-2.5 px-6 inline-flex items-center gap-2"
              >
                <Mic className="w-4 h-4" />
                Start Live Mock
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Mock Chat */}
        <AnimatePresence>
          {chatActive && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass-card p-6 sm:p-8"
            >
              <h2 className="font-serif text-xl font-bold gold-gradient-text mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Live Mock Interview
              </h2>

              {/* Chat messages */}
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 mb-6">
                {chatMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${msg.role === "candidate" ? "justify-end" : ""}`}
                  >
                    {msg.role !== "candidate" && (
                      <div
                        className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                          msg.role === "board"
                            ? "bg-primary/20 text-primary"
                            : "bg-[hsl(var(--success)/0.2)] text-[hsl(var(--success))]"
                        }`}
                      >
                        {msg.role === "board" ? "BM" : "MF"}
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] p-4 rounded-xl text-sm leading-relaxed ${
                        msg.role === "candidate"
                          ? "bg-primary/10 text-foreground border border-primary/20 rounded-br-none"
                          : msg.role === "mentor"
                          ? "bg-[hsl(var(--success)/0.08)] text-foreground border border-[hsl(var(--success)/0.2)] rounded-bl-none"
                          : "bg-secondary text-foreground border border-border rounded-bl-none"
                      }`}
                    >
                      {msg.role === "mentor" && (
                        <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--success))] font-semibold block mb-1">
                          Mentor Feedback
                        </span>
                      )}
                      {msg.role === "board" && (
                        <span className="text-[10px] uppercase tracking-wider text-primary font-semibold block mb-1">
                          Board Member
                        </span>
                      )}
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Answer input */}
              <div className="border-t border-border pt-4">
                <div className="flex items-start gap-3">
                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Type your answer or use the microphone..."
                    rows={3}
                    className="flex-1 bg-secondary/40 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={toggleRecording}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                        isRecording
                          ? "bg-destructive/20 text-destructive border border-destructive/30 animate-pulse"
                          : "bg-secondary border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                      }`}
                      title={isRecording ? "Stop Recording" : "Record Answer"}
                    >
                      {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={submitAnswer}
                      disabled={sendingAnswer || !transcript.trim()}
                      className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40"
                      title="Submit Answer"
                    >
                      {sendingAnswer ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                {isRecording && (
                  <p className="text-xs text-destructive mt-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                    Recording... Speak clearly into your microphone
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
