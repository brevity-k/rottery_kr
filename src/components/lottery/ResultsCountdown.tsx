"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getKSTDate, getDrawDateForRound } from "@/lib/utils/kst";
import {
  LOTTO_DRAW_HOUR,
  LOTTO_DRAW_MINUTE,
  LOTTO_RESULTS_DELAY_MINUTES,
} from "@/lib/constants";

type Phase = "before-draw" | "after-draw" | "results-available" | "hidden";

function getPhaseInfo(round: number, hasResult: boolean) {
  if (hasResult) {
    return { phase: "results-available" as Phase, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const kstNow = getKSTDate();
  const drawDate = getDrawDateForRound(round);

  // Saturday draw time
  const drawTime = new Date(drawDate);
  drawTime.setHours(LOTTO_DRAW_HOUR, LOTTO_DRAW_MINUTE, 0, 0);

  // Sunday results available time (00:00 + delay)
  const resultsTime = new Date(drawDate);
  resultsTime.setDate(resultsTime.getDate() + 1);
  resultsTime.setHours(0, LOTTO_RESULTS_DELAY_MINUTES, 0, 0);

  let phase: Phase;
  let targetTime: Date;

  if (kstNow < drawTime) {
    // Show only on Saturday (day 6) — during the rest of the week, DrawCountdown handles it
    if (kstNow.getDay() !== 6) {
      return { phase: "hidden" as Phase, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    phase = "before-draw";
    targetTime = drawTime;
  } else if (kstNow < resultsTime) {
    phase = "after-draw";
    targetTime = resultsTime;
  } else {
    return { phase: "results-available" as Phase, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const diffMs = targetTime.getTime() - kstNow.getTime();
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { phase, days, hours, minutes, seconds };
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-3xl sm:text-4xl font-bold tabular-nums">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-xs opacity-70 mt-1">{label}</span>
    </div>
  );
}

const phaseStyles: Record<string, { gradient: string; label: string }> = {
  "before-draw": {
    gradient: "from-blue-500 to-blue-600",
    label: "추첨까지",
  },
  "after-draw": {
    gradient: "from-amber-500 to-amber-600",
    label: "결과 확인까지",
  },
};

export default function ResultsCountdown({
  round,
  hasResult,
}: {
  round: number;
  hasResult: boolean;
}) {
  const [info, setInfo] = useState({ phase: "hidden" as Phase, days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setInfo(getPhaseInfo(round, hasResult));
    const interval = setInterval(() => {
      setInfo(getPhaseInfo(round, hasResult));
    }, 1000);
    return () => clearInterval(interval);
  }, [round, hasResult]);

  if (!mounted || info.phase === "hidden") return null;

  if (info.phase === "results-available") {
    return (
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-center text-white shadow-lg mt-3">
        <p className="text-lg font-bold mb-2">
          제 {round}회 결과가 공개되었습니다!
        </p>
        <Link
          href={`/lotto/results/${round}`}
          className="inline-block bg-white text-green-700 font-semibold px-6 py-2 rounded-lg hover:bg-green-50 transition-colors"
        >
          당첨번호 확인하기 &rarr;
        </Link>
      </div>
    );
  }

  const style = phaseStyles[info.phase];

  return (
    <div className={`bg-gradient-to-r ${style.gradient} rounded-2xl p-6 text-center text-white shadow-lg mt-3`}>
      <p className="text-sm opacity-80 mb-1">
        제 {round}회 {style.label}
      </p>
      <div className="flex justify-center gap-3 sm:gap-5">
        {info.days > 0 && <TimeUnit value={info.days} label="일" />}
        <TimeUnit value={info.hours} label="시간" />
        <TimeUnit value={info.minutes} label="분" />
        <TimeUnit value={info.seconds} label="초" />
      </div>
    </div>
  );
}
