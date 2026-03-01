import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Mic, MicOff, Send, User, MessageSquare, FileText, Loader2, ArrowRight, MessageCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const INTERVIEW_WEBHOOK = "https://tejanaidu9.app.n8n.cloud/webhook/interview";

interface InterviewQuestion {
  question: string;
  category?: string;
  follow_up?: string;
}

interface ChatMessage {
  role: "board" | "candidate" | "mentor" | "actions";
  text: string;
}

// Simple markdown renderer for bold and bullet points
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    // Bold: **text**
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    // Bullet points
    const trimmed = line.trimStart();
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || /^\d+\.\s/.test(trimmed)) {
      return (
        <li key={i} className="ml-4 list-disc">
          {rendered}
        </li>
      );
    }
    if (line.trim() === "") return <br key={i} />;
    return <p key={i}>{rendered}</p>;
  });
}

export default function InterviewHub() {
  const { user } = useAuth();
  const [dafFile, setDafFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const [chatActive, setChatActive] = useState(false);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [sendingAnswer, setSendingAnswer] = useState(false);
  const [awaitingAction, setAwaitingAction] = useState(false); // true after mentor feedback
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
      formData.append("mode", "daf");

      const res = await fetch(INTERVIEW_WEBHOOK, { method: "POST", body: formData });
      const data = await res.json();

      let qs: InterviewQuestion[] = [];
      if (Array.isArray(data)) qs = data;
      else if (data.questions && Array.isArray(data.questions)) qs = data.questions;
      else if (data.question) qs = [{ question: data.question, category: data.category || "General Profile" }];

      setQuestions(qs);
      if (qs.length === 0) toast.info("No questions returned. Check your n8n workflow output.");
      else toast.success(`Generated ${qs.length} high-probability questions!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to process DAF. Ensure n8n is active.");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const startMock = () => {
    if (questions.length === 0) { toast.error("Upload your DAF first to generate questions"); return; }
    setChatActive(true);
    setCurrentQIdx(0);
    setAwaitingAction(false);
    setChatMessages([{ role: "board", text: questions[0].question }]);
  };

  const toggleRecording = useCallback(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      toast.error("Speech recognition is not supported in your browser"); return;
    }
    if (isRecording) { recognitionRef.current?.stop(); setIsRecording(false); return; }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    recognition.onresult = (event: any) => {
      let t = "";
      for (let i = 0; i < event.results.length; i++) t += event.results[i][0].transcript;
      setTranscript(t);
    };
    recognition.onerror = () => { setIsRecording(false); toast.error("Speech recognition error"); };
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [isRecording]);

  // Submit answer — handles both "feedback" continuation and regular answers
  const submitAnswer = async () => {
    const answer = transcript.trim();
    if (!answer) { toast.error("Please record or type your answer"); return; }

    setSendingAnswer(true);
    setAwaitingAction(false);
    setChatMessages((prev) => [...prev, { role: "candidate", text: answer }]);
    setTranscript("");

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
      const feedback = data.output || data.mentor_feedback || data.feedback || data.message || "Observation recorded.";

      setChatMessages((prev) => [...prev, { role: "mentor", text: feedback }]);
      setAwaitingAction(true); // Show action buttons, keep input enabled
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "mentor", text: "Could not get feedback. The board is busy processing." },
      ]);
      setAwaitingAction(true);
    } finally {
      setSendingAnswer(false);
    }
  };

  const handleContinueDiscussion = () => {
    // Keep same question index, user can type follow-up — mode stays "feedback"
    setAwaitingAction(false);
    toast.info("Continue the discussion. Your follow-up will be sent on the same topic.");
  };

  const handleNextQuestion = async () => {
    setAwaitingAction(false);
    setSendingAnswer(true);
    setChatMessages((prev) => [...prev, { role: "board", text: "Board is reviewing your DAF for the next topic..." }]);

    try {
      const formData = new FormData();
      if (dafFile) formData.append("file", dafFile);
      formData.append("email", user?.email ?? "");
      formData.append("user_id", user?.id ?? "");
      formData.append("mode", "daf");

      const res = await fetch(INTERVIEW_WEBHOOK, { method: "POST", body: formData });
      const data = await res.json();

      let newQ: InterviewQuestion | null = null;
      if (Array.isArray(data) && data.length > 0) newQ = data[0];
      else if (data.question) newQ = { question: data.question, category: data.category || "General Profile" };

      if (newQ) {
        const nextIdx = currentQIdx + 1;
        setQuestions((prev) => [...prev, newQ!]);
        setCurrentQIdx(nextIdx);
        // Remove the loading message and add the real question
        setChatMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "board", text: newQ!.question },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "board", text: "Thank you. That concludes your interview. You may leave." },
        ]);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "board", text: "The board encountered an issue. Please try again." },
      ]);
    } finally {
      setSendingAnswer(false);
    }
  };

  const interviewEnded =
    chatMessages.length > 0 &&
    chatMessages[chatMessages.length - 1].role === "board" &&
    chatMessages[chatMessages.length - 1].text.includes("concludes your interview");

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-serif text-4xl sm:text-5xl font-bold mb-4">
            <span className="gold-gradient-text">Interview Hub</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Upload your DAF, get high-probability questions, and practice with a live mock board.
          </motion.p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-10">
        {/* DAF Upload */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6 sm:p-8">
          <h2 className="font-serif text-xl font-bold gold-gradient-text mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Upload Your DAF
          </h2>
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/40 transition-colors cursor-pointer" onClick={() => document.getElementById("daf-input")?.click()}>
            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{dafFile ? dafFile.name : "Click to upload your DAF (PDF, DOC, DOCX)"}</p>
            <input id="daf-input" type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => setDafFile(e.target.files?.[0] || null)} />
          </div>
          <button onClick={handleDAFUpload} disabled={loadingQuestions || !dafFile} className="gold-glow-button mt-4 text-sm py-2.5 px-6 disabled:opacity-50 inline-flex items-center gap-2">
            {loadingQuestions ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loadingQuestions ? "Processing DAF..." : "Generate Questions"}
          </button>
        </motion.div>

        {/* Question Bank */}
        <AnimatePresence>
          {questions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-card p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-xl font-bold gold-gradient-text flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  High-Probability Question Bank
                </h2>
                <span className="text-xs text-muted-foreground">{questions.length} questions loaded</span>
              </div>
              <Accordion type="single" collapsible className="space-y-2">
                {questions.map((q, i) => (
                  <AccordionItem key={i} value={`q-${i}`} className="glass-card border-border/50 rounded-lg px-4">
                    <AccordionTrigger className="text-sm text-foreground hover:no-underline py-3">
                      <span className="flex items-center gap-3 text-left">
                        <span className="shrink-0 w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-semibold flex items-center justify-center">{i + 1}</span>
                        {q.question}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground pb-3">
                      {q.category && <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-2">{q.category}</span>}
                      {q.follow_up && <p className="mt-1">Potential Follow-up: {q.follow_up}</p>}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              <button onClick={startMock} className="gold-glow-button mt-6 text-sm py-2.5 px-6 inline-flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Start Live Mock
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Mock Chat */}
        <AnimatePresence>
          {chatActive && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-card p-6 sm:p-8">
              <h2 className="font-serif text-xl font-bold gold-gradient-text mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Live Mock Interview Board
              </h2>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 mb-6 scrollbar-thin scrollbar-thumb-primary/20">
                {chatMessages.map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${msg.role === "candidate" ? "justify-end" : ""}`}>
                    {msg.role !== "candidate" && (
                      <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                        msg.role === "board"
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : "bg-[hsl(var(--success)/0.2)] text-[hsl(var(--success))] border border-[hsl(var(--success)/0.3)]"
                      }`}>
                        {msg.role === "board" ? "BM" : "MF"}
                      </div>
                    )}
                    <div className={`max-w-[80%] p-4 rounded-xl text-sm leading-relaxed ${
                      msg.role === "candidate"
                        ? "bg-primary/10 text-foreground border border-primary/20 rounded-br-none"
                        : msg.role === "mentor"
                        ? "bg-[hsl(var(--success)/0.08)] text-foreground border border-[hsl(var(--success)/0.2)] rounded-bl-none"
                        : "bg-secondary text-foreground border border-border rounded-bl-none shadow-sm"
                    }`}>
                      {msg.role === "mentor" && (
                        <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--success))] font-bold block mb-1">Mentor Observation</span>
                      )}
                      {msg.role === "board" && (
                        <span className="text-[10px] uppercase tracking-wider text-primary font-bold block mb-1">Board Chairperson</span>
                      )}
                      <div className="space-y-1 [&_li]:my-0.5">{renderMarkdown(msg.text)}</div>
                    </div>
                  </motion.div>
                ))}

                {/* Action buttons after mentor feedback */}
                {awaitingAction && !interviewEnded && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 justify-center pt-2">
                    <button
                      onClick={handleContinueDiscussion}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-secondary border border-border text-foreground hover:border-primary/40 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Continue Discussion
                    </button>
                    <button
                      onClick={handleNextQuestion}
                      className="gold-glow-button text-sm py-2.5 px-5 inline-flex items-center gap-2"
                    >
                      <ArrowRight className="w-4 h-4" />
                      Next Question
                    </button>
                  </motion.div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input area — always enabled unless interview ended */}
              {!interviewEnded && (
                <div className="border-t border-border pt-4">
                  <div className="flex items-start gap-3">
                    <textarea
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitAnswer(); }
                      }}
                      placeholder={awaitingAction ? "Type a follow-up or click an action above..." : "Type your answer or use the microphone..."}
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
                      >
                        {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={submitAnswer}
                        disabled={sendingAnswer || !transcript.trim()}
                        className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40"
                      >
                        {sendingAnswer ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  {isRecording && (
                    <p className="text-xs text-destructive mt-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                      Recording... The Board is listening.
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
