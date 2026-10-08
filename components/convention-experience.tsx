"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  QrCode,
} from "lucide-react";
import type { Experience } from "@/lib/types";
import {
  conventionProgramme,
  type ConventionDay,
  type ProgrammeItem,
} from "@/lib/convention-programme";

type Props = {
  data: Experience;
};

function getNigeriaNow() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value || 0);

  return new Date(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute")
  );
}

function getMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function getProgrammeState(day: ConventionDay, now: Date) {
  const date =
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  let currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Friday's programme continues past midnight into Saturday morning.
  // Treat Saturday 12:00am to 4:00am as part of Friday's programme.
  const fridayOvernight =
    day.key === "friday" &&
    date === "2026-10-10" &&
    currentMinutes < 4 * 60;

  if (fridayOvernight) {
    currentMinutes += 24 * 60;
  }

  if (date !== day.date && !fridayOvernight) {
    return {
      current: null as ProgrammeItem | null,
      next: null as ProgrammeItem | null,
      ended: false,
    };
  }

  const current =
    day.items.find((item) => {
      const start = getMinutes(item.start);
      const end = getMinutes(item.end);

      return currentMinutes >= start && currentMinutes < end;
    }) || null;

  const next =
    day.items.find((item) => getMinutes(item.start) > currentMinutes) || null;

  return {
    current,
    next,
    ended: currentMinutes >= getMinutes(day.end),
  };
}

export default function ConventionExperience({ data }: Props) {
  const [qr, setQr] = useState("");
  const [now, setNow] = useState(getNigeriaNow());

  useEffect(() => {
    QRCode.toDataURL(data.registration_no, {
      width: 500,
      margin: 2,
      errorCorrectionLevel: "H",
    })
      .then(setQr)
      .catch(() => setQr(""));
  }, [data.registration_no]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(getNigeriaNow());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const today = useMemo(() => {
    const date =
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    return conventionProgramme.find((day) => day.date === date) || null;
  }, [now]);

  const displayDay = today || conventionProgramme[0];
  const programmeState = getProgrammeState(displayDay, now);

  return (
    <>
      <section className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#003B63] via-[#004F82] to-[#00B8E5] p-5 text-white shadow-xl sm:p-6">
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />

        <div className="relative">
          <p className="text-xs font-black tracking-[.16em] text-[#FFCC34]">
            {today ? today.label : "EYF EXPERIENCE"}
          </p>

          <h2 className="mt-2 text-2xl font-black">
            {today
              ? `🎉 WELCOME TO ${today.label}!`
              : "🎉 WELCOME TO EYF EXPERIENCE!"}
          </h2>

          <p className="mt-2 text-sm font-semibold text-white/80">
            Stay connected and enjoy the experience.
          </p>
        </div>
      </section>

      <section className="card overflow-hidden rounded-[1.75rem] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black tracking-[.16em] text-[#00B8E5]">
              DIGITAL CONVENTION PASS
            </p>
            <h2 className="mt-1 text-xl font-black text-[#003B63]">
              MY EYF PASS
            </h2>
          </div>

          <div className="rounded-xl bg-[#003B63] p-3 text-white">
            <QrCode size={20} />
          </div>
        </div>

        <div className="mt-5 grid items-center gap-5 md:grid-cols-[1fr_auto]">
          <div>

            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              EYF Code
            </p>

            <p className="mt-1 inline-flex rounded-lg bg-[#003B63] px-3 py-2 text-lg font-black tracking-wider text-white">
              {data.registration_no}
            </p>

            <p className="mt-4 text-xs font-semibold text-slate-500">
              Present this QR code to an authorized convention worker for
              scanning.
            </p>
          </div>

          <div className="mx-auto rounded-2xl border-4 border-[#003B63] bg-white p-3">
            {qr ? (
              <img
                src={qr}
                alt={`QR code for ${data.registration_no}`}
                className="h-44 w-44 sm:h-52 sm:w-52"
              />
            ) : (
              <div className="grid h-44 w-44 place-items-center text-center text-xs font-bold text-slate-400 sm:h-52 sm:w-52">
                Generating QR code...
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="card rounded-[1.75rem] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black tracking-[.16em] text-[#00B8E5]">
              {displayDay.label}
            </p>

            <h2 className="mt-1 text-xl font-black text-[#003B63]">
              TODAY'S ORDER OF SERVICE
            </h2>
          </div>

          <CalendarDays className="shrink-0 text-[#004F82]" />
        </div>

        <div className="mt-4 rounded-2xl bg-[#003B63] p-4 text-white">
          <p className="text-sm font-black">{displayDay.date}</p>

          {programmeState.current ? (
            <div className="mt-4 rounded-xl bg-[#00B8E5] p-3">
              <p className="text-[10px] font-black tracking-wider text-white/80">
                NOW
              </p>

              <p className="mt-1 text-lg font-black">
                {programmeState.current.title}
              </p>

              <p className="mt-1 text-xs font-semibold text-white/80">
                {programmeState.current.time}
              </p>
            </div>
          ) : programmeState.next ? (
            <div className="mt-4 rounded-xl bg-white/10 p-3">
              <p className="text-[10px] font-black tracking-wider text-[#FFCC34]">
                UP NEXT
              </p>

              <p className="mt-1 text-lg font-black">
                {programmeState.next.title}
              </p>

              <p className="mt-1 text-xs font-semibold text-white/70">
                {programmeState.next.time}
              </p>
            </div>
          ) : programmeState.ended ? (
            <div className="mt-4 rounded-xl bg-white/10 p-3">
              <p className="font-black">
                TODAY'S PROGRAMME HAS ENDED
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-xl bg-white/10 p-3">
              <p className="font-black">
                PROGRAMME INFORMATION
              </p>

              <p className="mt-1 text-xs text-white/70">
                The convention programme will appear here.
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-2">
          {displayDay.items.map((item, index) => {
            const isCurrent =
              programmeState.current?.title === item.title &&
              programmeState.current?.time === item.time;

            const isNext =
              programmeState.next?.title === item.title &&
              programmeState.next?.time === item.time;

            return (
              <div
                key={`${item.title}-${item.time}-${index}`}
                className={`rounded-2xl border p-4 ${
                  isCurrent
                    ? "border-[#00B8E5] bg-[#00B8E5]/10"
                    : isNext
                    ? "border-[#FFCC34] bg-[#FFCC34]/10"
                    : "border-slate-100 bg-slate-50"
                }`}
              >
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#003B63] text-xs font-black text-white">
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-black text-[#003B63]">
                        {item.title}
                      </p>

                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#00B8E5] px-2 py-1 text-[9px] font-black text-white">
                          <CheckCircle2 size={11} />
                          NOW
                        </span>
                      )}

                      {isNext && !isCurrent && (
                        <span className="rounded-full bg-[#FFCC34] px-2 py-1 text-[9px] font-black text-[#003B63]">
                          UP NEXT
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-500">
                      <Clock3 size={12} />
                      {item.time}
                    </div>

                    {item.anchor && (
                      <p className="mt-1 text-xs font-semibold text-slate-400">
                        {item.anchor}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
