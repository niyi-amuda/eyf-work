"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, CheckCircle2, Gift, Gamepad2, LogOut, Medal, RefreshCw, Trophy } from "lucide-react";
import Countdown from "@/components/countdown";
import Games from "@/components/games";
import type { Experience } from "@/lib/types";
import { days, formatDate } from "@/lib/utils";

export default function Dashboard() {
  const [data, setData] = useState<Experience | null>(null);
  const [error, setError] = useState("");
  const [offline, setOffline] = useState(false);

  async function load() {
    setError("");
    try {
      const r = await fetch("/api/experience/me", { cache: "no-store" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setError(d.message || "Your session could not be loaded."); return; }
      setData(d);
    } catch { setOffline(true); setError("You're offline. Live EYF data cannot be loaded right now."); }
  }

  useEffect(() => {
    load();
    const online = () => setOffline(false);
    const offlineEvent = () => setOffline(true);
    window.addEventListener("online", online);
    window.addEventListener("offline", offlineEvent);
    return () => { window.removeEventListener("online", online); window.removeEventListener("offline", offlineEvent); };
  }, []);

  if (error && !data) return <main className="min-h-screen bg-[#f4f8fb] p-5"><div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center"><div className="card w-full rounded-[2rem] bg-white p-7 text-center"><img src="/eyf-logo.png" alt="EYF" className="mx-auto h-20 w-20 rounded-full object-contain"/><h1 className="mt-5 text-2xl font-black text-[#003B63]">We could not load your experience</h1><p className="mt-3 text-slate-600">{error}</p><div className="mt-5 flex gap-2 justify-center"><button onClick={load} className="inline-flex items-center gap-2 rounded-xl bg-[#00B8E5] px-5 py-3 font-black text-white"><RefreshCw size={16}/> TRY AGAIN</button><a href="/" className="rounded-xl bg-[#FFCC34] px-5 py-3 font-black text-[#003B63]">EYF CODE</a></div></div></div></main>;
  if (!data) return <main className="grid min-h-screen place-items-center bg-[#f4f8fb]"><div className="text-center"><img src="/eyf-logo.png" alt="EYF" className="mx-auto h-20 w-20 animate-pulse rounded-full object-contain"/><p className="mt-4 font-black text-[#003B63]">Loading EYF Experience...</p></div></main>;

  async function logout() { await fetch("/api/experience/logout", { method: "POST" }); location.href = "/"; }

  return (
    <main className="min-h-screen bg-[#f4f8fb] p-3 sm:p-5 lg:p-8">
      {offline && <div className="mx-auto mb-3 max-w-6xl rounded-xl bg-[#FFCC34] px-4 py-3 text-center text-sm font-black text-[#003B63]">You are offline. Live data and game scores cannot be loaded or saved until you reconnect.</div>}
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="hero relative overflow-hidden rounded-[2rem] p-5 text-white shadow-xl sm:p-7">
          <div className="absolute right-0 top-0 h-44 w-44 rounded-bl-full bg-[#00B8E5]/15" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-4"><img src="/eyf-logo.png" alt="EYF logo" className="h-16 w-16 rounded-full bg-white object-contain sm:h-20 sm:w-20"/><div><p className="text-xs font-black tracking-[.16em] text-[#FFCC34]">EYF 2026 EXPERIENCE</p><h1 className="mt-1 text-2xl font-black sm:text-4xl">WELCOME, {cleanDisplayName(data.full_name)}</h1><p className="mt-2 text-sm font-bold text-white/80">{data.registration_no} <span className="text-white/40">•</span> {data.branch}</p><span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black ${data.payment_verified ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{data.payment_verified ? <CheckCircle2 size={13} /> : <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}{data.payment_status}</span></div></div>
            <button onClick={logout} aria-label="Log out" className="rounded-xl bg-white/10 p-3 transition hover:bg-white/20"><LogOut size={20}/></button>
          </div>
        </header>

        <Countdown />

        <section>
          <SectionTitle title="MY EYF STATS" />
          <div className="grid gap-3 sm:grid-cols-3"><Stat icon={<Trophy />} label="EYF Points" value={data.points} /><Stat icon={<Gamepad2 />} label="Games Played" value={data.games_played} /><Stat icon={<Gift />} label="Rewards Won" value={data.wins.length} /></div>
        </section>

        <section className="card rounded-[1.75rem] bg-white p-5 sm:p-6">
          <SectionTitle title="MY CONVENTION ATTENDANCE" icon={<CalendarCheck />} />
          <div className="mt-4 grid gap-3 md:grid-cols-3">{days.map((x) => { const c = data.checkins.find(v => v.day === x.key); return <div key={x.key} className={`rounded-2xl border p-4 ${c ? "border-[#00B8E5]/30 bg-[#00B8E5]/5" : "border-slate-100 bg-slate-50"}`}><p className="font-black text-[#003B63]">{x.label}</p><p className="mt-1 text-sm text-slate-500">{x.date}, 2026</p><p className={`mt-4 text-sm font-black ${c ? "text-green-700" : "text-slate-500"}`}>{c ? "✓ CHECKED IN" : "○ NOT YET CHECKED IN"}</p>{c && <small className="mt-1 block text-slate-500">{formatDate(c.checked_in_at || x.key)}</small>}</div>; })}</div>
        </section>

        <section><SectionTitle title="GAMES" /><Games onUpdate={(points, games) => setData(prev => prev ? { ...prev, points, games_played: games } : prev)} /></section>

        <section className="card rounded-[1.75rem] bg-white p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><SectionTitle title="POINTS LEADERBOARD" icon={<Medal />} /><LeaderboardRefresh /></div><Leaderboard /></section>

        <section className="card rounded-[1.75rem] bg-white p-5 sm:p-6"><SectionTitle title="MY REWARDS" icon={<Gift />} />{data.wins.length === 0 ? <div className="mt-4 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">No rewards yet. Keep participating — more surprises may be coming! 🎁</div> : <div className="mt-4 grid gap-3 md:grid-cols-2">{data.wins.map(w => <div key={w.id} className="rounded-2xl border border-slate-100 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-lg font-black text-[#003B63]">{w.reward_label}</p><p className="mt-1 text-xs text-slate-500">{formatDate(w.created_at)}</p></div><Gift className="text-[#FFCC34]"/></div><div className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-[#004F82]">{w.claim_status === "claimed" ? "CLAIMED ✓" : w.can_claim ? "READY TO CLAIM" : "PAYMENT VERIFICATION REQUIRED"}</div></div>)}</div>}</section>

        <footer className="pb-5 text-center text-xs font-bold text-slate-400">EXCELLENT YOUTH FELLOWSHIP • HIGHER REALMS &amp; REALITIES</footer>
      </div>
    </main>
  );
}

function cleanDisplayName(name: string) {
  return name
    .replace(/^👋\s*/, "")
    .replace(/\s*•\s*Payment\s+(?:VERIFIED|PENDING)\s*[✅⏳]?\s*$/i, "")
    .trim();
}

function SectionTitle({ title, icon }: { title: string; icon?: React.ReactNode }) { return <h2 className="flex items-center gap-2 text-sm font-black tracking-[.13em] text-[#003B63]">{icon || <span className="h-2 w-2 rounded-full bg-[#00B8E5]"/>}{title}</h2>; }
function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { return <div className="card rounded-2xl bg-white p-5"><div className="text-[#00B8E5]">{icon}</div><div className="mt-2 text-3xl font-black text-[#003B63]">{value}</div><div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">{label}</div></div>; }
function LeaderboardRefresh() { const [loading,setLoading]=useState(false); return <button onClick={()=>{setLoading(true);window.dispatchEvent(new Event("eyf:refresh-leaderboard"));setTimeout(()=>setLoading(false),500)}} className="rounded-xl bg-slate-100 p-2 text-[#004F82]" aria-label="Refresh leaderboard"><RefreshCw size={17} className={loading?"animate-spin":""}/></button>; }
function Leaderboard() { const [rows,setRows]=useState<any[]>([]); const [error,setError]=useState(""); async function load(){try{const r=await fetch("/api/experience/me?view=leaderboard",{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error();setRows(d)}catch{setError("Leaderboard could not be loaded right now.")}} useEffect(()=>{load();const fn=()=>load();window.addEventListener("eyf:refresh-leaderboard",fn);return()=>window.removeEventListener("eyf:refresh-leaderboard",fn)},[]); if(error)return <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>; return <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead><tr className="text-[10px] uppercase tracking-wider text-slate-500"><th className="p-3">Rank</th><th className="p-3">Name</th><th className="p-3">Branch</th><th className="p-3 text-right">Points</th></tr></thead><tbody>{rows.map((r,i)=><tr key={r.registration_no} className="border-t border-slate-100"><td className="p-3 font-black text-[#004F82]">{i<3?["🥇","🥈","🥉"][i]:i+1}</td><td className="p-3 font-bold text-[#003B63]">{r.full_name}</td><td className="p-3 text-slate-500">{r.branch}</td><td className="p-3 text-right font-black text-[#003B63]">{r.points}</td></tr>)}</tbody></table>{rows.length===0&&<p className="p-5 text-center text-sm text-slate-500">No scores yet.</p>}</div>; }
