"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { LottoResult } from "@/types/lottery";
import LottoBall from "@/components/lottery/LottoBall";
import ResultsCountdown from "@/components/lottery/ResultsCountdown";
import { getKSTDate, getDrawDateForRound } from "@/lib/utils/kst";
import { LOTTO_RESULTS_DELAY_MINUTES } from "@/lib/constants";

export default function PredictionResults({
  round,
  result,
}: {
  round: number;
  result: LottoResult | null;
}) {
  const [mounted, setMounted] = useState(false);
  const [pastResultsTime, setPastResultsTime] = useState(false);

  useEffect(() => {
    setMounted(true);

    function checkTime() {
      const kstNow = getKSTDate();
      const drawDate = getDrawDateForRound(round);
      const resultsTime = new Date(drawDate);
      resultsTime.setDate(resultsTime.getDate() + 1);
      resultsTime.setHours(0, LOTTO_RESULTS_DELAY_MINUTES, 0, 0);
      setPastResultsTime(kstNow >= resultsTime);
    }

    checkTime();
    const interval = setInterval(checkTime, 60_000);
    return () => clearInterval(interval);
  }, [round]);

  if (!mounted) return null;

  // Result data available from build time
  if (result) {
    const numbers = [
      result.drwtNo1,
      result.drwtNo2,
      result.drwtNo3,
      result.drwtNo4,
      result.drwtNo5,
      result.drwtNo6,
    ];

    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-bold text-green-800 mb-3">
          제 {round}회 실제 당첨번호
        </h2>
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {numbers.map((num) => (
            <LottoBall key={num} number={num} size="lg" />
          ))}
          <LottoBall number={result.bnusNo} size="lg" isBonus />
        </div>
        <Link
          href={`/lotto/results/${round}`}
          className="text-sm text-green-700 font-medium hover:text-green-800 hover:underline"
        >
          상세 결과 보기 &rarr;
        </Link>
      </div>
    );
  }

  // Past results time but no data yet (data not rebuilt)
  if (pastResultsTime) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6 text-center">
        <p className="text-amber-800 font-medium mb-2">
          결과가 업데이트되었습니다!
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-amber-700 font-medium hover:text-amber-800 underline"
        >
          페이지를 새로고침해주세요
        </button>
      </div>
    );
  }

  // Before results — show countdown
  return (
    <div className="mb-6">
      <ResultsCountdown round={round} hasResult={false} />
      <p className="text-sm text-gray-500 text-center mt-3">
        추첨 후 이 페이지에서 예측과 실제 결과를 비교할 수 있습니다.
      </p>
    </div>
  );
}
