"use client";

import { useState } from "react";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const r = await fetch("/api/experience/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(d.message || "We could not verify that code.");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("We couldn't connect right now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_50%_0%,rgba(0,184,229,.22),transparent_35%),linear-gradient(145deg,#003B63,#004F82)] px-4 py-8 text-[#003B63]">
      <div className="w-full max-w-md">
        <form onSubmit={submit} className="rounded-[2rem] bg-white p-7 shadow-[0_25px_70px_rgba(0,20,45,.35)] sm:p-9">
          <div className="flex justify-center">
            <div className="rounded-full bg-white p-1.5 shadow-[0_10px_30px_rgba(0,59,99,.16)] ring-1 ring-[#00B8E5]/20">
              <img src="/eyf-logo.png" alt="Excellent Youth Fellowship" className="h-28 w-28 rounded-full object-contain sm:h-32 sm:w-32" />
            </div>
          </div>

          <div className="mt-6 text-center">
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Welcome to EYF Experience</h1>
            <p className="mt-2 text-sm text-slate-500">Enter your registration code to continue.</p>
          </div>

          <label htmlFor="eyf-code" className="mt-7 block text-sm font-black text-[#003B63]">EYF Code</label>
          <input
            id="eyf-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="EYF Code"
            className="mt-2 w-full rounded-2xl border-2 border-slate-200 px-5 py-4 text-lg font-black tracking-wider text-[#003B63] outline-none transition placeholder:text-slate-400 focus:border-[#00B8E5] focus:ring-4 focus:ring-[#00B8E5]/15"
            autoCapitalize="characters"
            autoComplete="off"
            inputMode="text"
            required
          />

          {error && <p className="mt-3 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}

          <button
            disabled={busy}
            className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#FFCC34] px-5 py-4 font-black text-[#003B63] shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? <><Loader2 size={19} className="animate-spin" /> CHECKING...</> : <>ENTER MY EXPERIENCE <ArrowRight size={20} /></>}
          </button>

          <div className="mt-5 flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
            <ShieldCheck size={15} className="text-[#00B8E5]" />
            Your experience session is protected.
          </div>
        </form>

        <p className="mt-6 text-center text-xs font-black tracking-[.16em] text-white/75">
          ONE FAMILY&nbsp;&nbsp;|&nbsp;&nbsp;ONE VISION&nbsp;&nbsp;|&nbsp;&nbsp;HIGHER REALMS
        </p>
      </div>
    </main>
  );
}
