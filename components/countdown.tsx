"use client";

import { useEffect, useState } from "react";

const TARGET_MS = Date.parse("2026-10-08T00:00:00+01:00");

export default function Countdown() {
  const [left, setLeft] = useState(Math.max(0, TARGET_MS - Date.now()));
  useEffect(() => {
    const update = () => setLeft(Math.max(0, TARGET_MS - Date.now()));
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, []);

  const total = Math.floor(left / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  return (
    <section className="overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#003B63] to-[#004F82] p-5 text-white shadow-xl sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-wider text-[#FFCC34]">THE CONVENTION IS COMING 🔥</p>
          <p className="mt-1 text-xs font-semibold text-white/70">October 8, 2026 • Africa/Lagos</p>
        </div>
        <span className="hidden rounded-full bg-[#00B8E5]/20 px-3 py-1 text-xs font-black text-[#00B8E5] sm:block">COUNTDOWN</span>
      </div>
      <div className="mt-5 grid grid-cols-4 gap-2 sm:gap-3">
        <Box n={d} label="Days" />
        <Box n={h} label="Hours" />
        <Box n={m} label="Minutes" />
        <Box n={s} label="Seconds" />
      </div>
    </section>
  );
}

function Box({ n, label }: { n: number; label: string }) {
  return <div className="rounded-2xl bg-white p-3 text-center text-[#003B63] shadow-sm"><div className="text-2xl font-black sm:text-4xl">{String(n).padStart(2, "0")}</div><div className="mt-1 text-[9px] font-black uppercase tracking-widest text-[#004F82]/70">{label}</div></div>;
}
