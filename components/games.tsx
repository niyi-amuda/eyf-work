"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Gamepad2, Loader2, RotateCcw, Star, Trophy, XCircle } from "lucide-react";

type Question = {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  difficulty: string;
  category: string;
  points: number;
  reference: string | null;
};

type GameResult = { ok?: boolean; message?: string; points?: number; games_played?: number; points_awarded?: number; correct?: boolean; added?: number };

export default function Games({ onUpdate }: { onUpdate: (p: number, g: number) => void }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizBusy, setQuizBusy] = useState(false);
  const [quizMessage, setQuizMessage] = useState("");
  const [quizDone, setQuizDone] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [tapState, setTapState] = useState<"idle" | "playing" | "saving" | "done">("idle");
  const [tapMessage, setTapMessage] = useState("");
  const [loadError, setLoadError] = useState("");

  const current = questions[quizIndex];

  useEffect(() => {
    if (!current || quizDone) return;

    setSelectedAnswer(null);
    setTimeLeft(10);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((value) => {
        if (value <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }

          if (quizIndex + 1 >= questions.length) {
            setQuizDone(true);
          } else {
            setQuizIndex((v) => v + 1);
          }

          return 0;
        }

        return value - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [quizIndex, questions.length, quizDone, current?.id]);
  const options = useMemo(() => current ? [
    ["A", current.option_a], ["B", current.option_b], ["C", current.option_c], ["D", current.option_d],
  ] as const : [], [current]);

  async function loadQuestions() {
    setLoadError("");
    try {
      const r = await fetch("/api/game/questions?limit=10", { cache: "no-store" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.message || "We could not load the quiz.");
      setQuestions(d.questions || []);
      setQuizIndex(0);
      setQuizDone(false);
      setQuizScore(0);
      setQuizMessage("");
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "We could not load the quiz.");
    }
  }

  useEffect(() => { loadQuestions(); }, []);

  async function answerQuestion(answer: string) {
    if (!current || quizBusy || selectedAnswer) return;

    setSelectedAnswer(answer);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setQuizBusy(true);
    setQuizMessage("");
    try {
      const r = await fetch("/api/game/quiz", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questionId: current.id, answer }),
      });
      const d: GameResult = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) {
        setSelectedAnswer(null);
        setQuizMessage(d.message || "We couldn't save that answer. Please try again.");
        return;
      }
      const awarded = Number(d.points_awarded || d.added || 0);
      setQuizScore((v) => v + awarded);
      setQuizMessage(d.message || (d.correct ? `+${awarded} POINTS 🎉` : "Not quite — keep going!"));
      if (typeof d.points === "number" && typeof d.games_played === "number") onUpdate(d.points, d.games_played);
      window.setTimeout(() => {
        if (quizIndex + 1 >= questions.length) setQuizDone(true);
        else setQuizIndex((v) => v + 1);
      }, 650);
    } catch {
      setQuizMessage("We couldn't save that answer. Please try again.");
    } finally {
      setQuizBusy(false);
    }
  }

  async function tapStar() {
    if (tapState !== "playing") return;
    setTapState("saving");
    setTapMessage("SAVING SCORE...");
    try {
      const r = await fetch("/api/game/tap-star", { method: "POST" });
      const d: GameResult = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) {
        setTapMessage(d.message || "We couldn't save your game. Please try again.");
        setTapState("playing");
        return;
      }
      if (typeof d.points === "number" && typeof d.games_played === "number") onUpdate(d.points, d.games_played);
      setTapMessage("+10 POINTS 🎉");
      setTapState("done");
    } catch {
      setTapMessage("We couldn't save your game. Please try again.");
      setTapState("playing");
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="overflow-hidden rounded-[1.75rem] border border-[#003B63]/10 bg-white shadow-[0_12px_35px_rgba(0,59,99,.08)]">
        <div className="bg-gradient-to-r from-[#003B63] to-[#004F82] p-5 text-white">
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 font-black"><Gamepad2 className="text-[#00B8E5]" /> BIBLE QUICK QUIZ</div><span className="rounded-full bg-[#FFCC34] px-3 py-1 text-xs font-black text-[#003B63]">{questions.length ? `${Math.min(quizIndex + 1, questions.length)}/${questions.length}` : "..."}</span></div>
          <p className="mt-2 text-sm text-white/70">Questions come directly from the active Supabase question bank.</p>
        </div>
        <div className="p-5 sm:p-6">
          {loadError ? <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{loadError}<button onClick={loadQuestions} className="mt-3 block rounded-xl bg-[#003B63] px-4 py-2 text-white">Try Again</button></div> : quizDone ? <div className="py-10 text-center"><Trophy className="mx-auto text-[#FFCC34]" size={50}/><h3 className="mt-4 text-2xl font-black text-[#003B63]">Quiz Complete! 🎉</h3><p className="mt-2 text-slate-600">You earned <b className="text-[#004F82]">{quizScore} points</b> in this round.</p><button onClick={loadQuestions} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#FFCC34] px-5 py-3 font-black text-[#003B63]"><RotateCcw size={17}/> PLAY AGAIN</button></div> : current ? <>
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <Badge label={current.difficulty} />
                <Badge label={current.category} />
                <>{current.reference && <Badge label={current.reference} />}</>
              </div>

              <div
                aria-live="polite"
                className="relative h-10 min-w-[78px] shrink-0 overflow-hidden rounded-xl bg-[#00B8E5] px-3 text-white shadow-sm"
              >
                <div
                  className="absolute inset-y-0 left-0 bg-white/20 transition-[width] duration-1000 ease-linear"
                  style={{ width: `${(timeLeft / 10) * 100}%` }}
                />
                <div className="relative flex h-full items-center justify-center gap-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-white/80">
                    TIME
                  </span>
                  <span className="text-sm font-black">{timeLeft}s</span>
                </div>
              </div>
            </div>
            <h3 className="mt-5 text-xl font-black leading-7 text-[#003B63] sm:text-2xl">{current.question}</h3>
            <div className="mt-5 grid gap-3">{options.map(([letter, text]) => <button key={letter} disabled={quizBusy} onClick={() => answerQuestion(letter)} className={`group flex min-h-14 items-center gap-3 rounded-2xl border-2 p-3 text-left font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  selectedAnswer === letter
                    ? "border-[#00B8E5] bg-[#00B8E5] text-white"
                    : "border-slate-200 text-[#003B63] hover:border-[#00B8E5] hover:bg-[#00B8E5]/5"
                }`}><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#003B63] text-sm font-black text-white group-hover:bg-[#00B8E5]">{letter}</span><span>{text}</span></button>)}</div>
            {quizBusy && <p className="mt-4 flex items-center gap-2 text-sm font-black text-[#004F82]"><Loader2 size={16} className="animate-spin"/> CHECKING ANSWER...</p>}
            {quizMessage && <p className="mt-4 rounded-2xl bg-[#00B8E5]/10 p-3 text-sm font-black text-[#004F82]">{quizMessage}</p>}
          </> : <div className="py-12 text-center text-slate-500">Loading your quiz...</div>}
        </div>
      </section>

      <section className="overflow-hidden rounded-[1.75rem] border border-[#003B63]/10 bg-white shadow-[0_12px_35px_rgba(0,59,99,.08)]">
        <div className="bg-gradient-to-br from-[#003B63] to-[#004F82] p-5 text-white"><div className="flex items-center gap-2 font-black"><Star className="fill-[#FFCC34] text-[#FFCC34]"/> TAP STAR</div><p className="mt-2 text-sm text-white/70">Start the round, then tap the moving star once to earn 10 points.</p></div>
        <div className="p-5 sm:p-6">
          <div className="star-arena relative flex min-h-[330px] items-center justify-center overflow-hidden rounded-[1.5rem] bg-[#003B63]">
            <div className="absolute inset-0 starfield" />
            {tapState === "idle" && <div className="relative z-10 text-center"><Star className="mx-auto mb-4 text-[#FFCC34]" size={72}/><h3 className="text-2xl font-black text-white">Tap the star!</h3><p className="mt-2 text-sm text-white/60">One tap • 10 points</p><button onClick={() => { setTapState("playing"); setTapMessage(""); }} className="mt-6 rounded-2xl bg-[#FFCC34] px-7 py-4 font-black text-[#003B63] shadow-lg">START GAME</button></div>}
            {tapState === "playing" && <button aria-label="Tap star target" onClick={tapStar} className="star-target relative z-10 grid h-32 w-32 place-items-center rounded-full text-[#FFCC34] transition-transform hover:scale-105 active:scale-95"><Star className="h-28 w-28 fill-[#FFCC34] drop-shadow-[0_0_25px_rgba(255,204,52,.75)]"/></button>}
            {tapState === "saving" && <div className="relative z-10 text-center text-white"><Loader2 className="mx-auto animate-spin text-[#00B8E5]" size={56}/><p className="mt-4 font-black text-[#FFCC34]">SAVING SCORE...</p></div>}
            {tapState === "done" && <div className="relative z-10 text-center"><CheckCircle2 className="mx-auto text-[#00B8E5]" size={64}/><h3 className="mt-4 text-2xl font-black text-white">Round Complete!</h3><p className="mt-2 text-xl font-black text-[#FFCC34]">{tapMessage}</p><button onClick={() => { setTapState("idle"); setTapMessage(""); }} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-black text-[#003B63]"><RotateCcw size={16}/> PLAY AGAIN</button></div>}
          </div>
          {tapMessage && tapState === "playing" && <p className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700"><XCircle size={17}/>{tapMessage}</p>}
        </div>
      </section>
    </div>
  );
}

function Badge({ label }: { label: string }) { return <span className="rounded-full bg-[#00B8E5]/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#004F82]">{label}</span>; }
