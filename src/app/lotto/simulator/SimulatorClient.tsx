"use client";

import { useState, useCallback } from "react";
import LottoBall from "@/components/lottery/LottoBall";
import { runSimulation, SimulationResult } from "@/lib/lottery/simulator";
import { formatKRW } from "@/lib/utils/format";

const TIER_LABELS: Record<number, string> = {
  1: "1등 (6개 일치)",
  2: "2등 (5개+보너스)",
  3: "3등 (5개 일치)",
  4: "4등 (4개 일치)",
  5: "5등 (3개 일치)",
};

const DRAW_PRESETS = [
  { label: "100회", value: 100 },
  { label: "1,000회", value: 1_000 },
  { label: "10,000회", value: 10_000 },
  { label: "100,000회", value: 100_000 },
];

export default function SimulatorClient() {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const toggleNumber = (num: number) => {
    setSelectedNumbers((prev) => {
      if (prev.includes(num)) return prev.filter((n) => n !== num);
      if (prev.length >= 6) return prev;
      return [...prev, num].sort((a, b) => a - b);
    });
    setResult(null);
  };

  const handleAutoSelect = () => {
    const pool: number[] = [];
    for (let i = 1; i <= 45; i++) pool.push(i);
    for (let i = pool.length - 1; i > pool.length - 7; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    setSelectedNumbers(pool.slice(pool.length - 6).sort((a, b) => a - b));
    setResult(null);
  };

  const handleReset = () => {
    setSelectedNumbers([]);
    setResult(null);
  };

  const handleSimulate = useCallback(
    (drawCount: number) => {
      if (selectedNumbers.length !== 6) return;
      setIsRunning(true);
      // Use setTimeout to allow UI to show loading state
      setTimeout(() => {
        const simResult = runSimulation(selectedNumbers, drawCount);
        setResult(simResult);
        setIsRunning(false);
      }, 50);
    },
    [selectedNumbers]
  );

  const handleCopy = () => {
    if (!result) return;
    const roi = (((result.totalWon - result.totalSpent) / result.totalSpent) * 100).toFixed(1);
    const text = `🎰 로또 시뮬레이터 결과\n${result.drawCount.toLocaleString()}회 시뮬레이션\n💰 투자: ${formatKRW(result.totalSpent)}\n💸 당첨: ${formatKRW(result.totalWon)}\n📉 수익률: ${roi}%\n\nhttps://lottery.io.kr/lotto/simulator`;
    navigator.clipboard.writeText(text);
    alert("결과가 클립보드에 복사되었습니다!");
  };

  const handleKakaoShare = () => {
    if (!result) return;
    const Kakao = window.Kakao;
    if (!Kakao) {
      alert("카카오톡 SDK를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    if (!Kakao.isInitialized()) {
      Kakao.init("accfcea8c90806c685d4321fa93a4501");
    }
    const roi = (((result.totalWon - result.totalSpent) / result.totalSpent) * 100).toFixed(1);
    Kakao.Share.sendDefault({
      objectType: "text",
      text: `🎰 로또 시뮬레이터 결과\n${result.drawCount.toLocaleString()}회 시뮬레이션\n💰 투자: ${formatKRW(result.totalSpent)}\n💸 당첨: ${formatKRW(result.totalWon)}\n📉 수익률: ${roi}%`,
      link: {
        mobileWebUrl: "https://lottery.io.kr/lotto/simulator",
        webUrl: "https://lottery.io.kr/lotto/simulator",
      },
    });
  };

  const netProfit = result ? result.totalWon - result.totalSpent : 0;
  const roi = result ? ((netProfit / result.totalSpent) * 100).toFixed(1) : "0";

  return (
    <div>
      {/* Number Selection */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">번호 선택</h2>
          <span className="text-sm text-gray-500">
            6개 중 <span className="font-bold text-blue-600">{selectedNumbers.length}개</span> 선택됨
          </span>
        </div>

        <div className="grid grid-cols-9 gap-1.5 sm:gap-2 mb-4">
          {Array.from({ length: 45 }, (_, i) => i + 1).map((num) => {
            const isSelected = selectedNumbers.includes(num);
            return (
              <button
                key={num}
                onClick={() => toggleNumber(num)}
                className={`transition-all ${
                  isSelected ? "scale-110" : selectedNumbers.length >= 6 ? "opacity-30" : "opacity-60 hover:opacity-100"
                }`}
              >
                <LottoBall number={num} size="sm" />
              </button>
            );
          })}
        </div>

        {selectedNumbers.length > 0 && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-xl">
            <span className="text-sm text-blue-600 font-medium">선택:</span>
            <div className="flex gap-1.5">
              {selectedNumbers.map((num) => (
                <LottoBall key={num} number={num} size="sm" />
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleAutoSelect}
            className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25"
          >
            자동 선택
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            초기화
          </button>
        </div>
      </section>

      {/* Simulation Controls */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">시뮬레이션 횟수</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {DRAW_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handleSimulate(preset.value)}
              disabled={selectedNumbers.length !== 6 || isRunning}
              className="bg-gray-100 text-gray-700 font-medium py-3 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed"
            >
              {isRunning ? "계산 중..." : preset.label}
            </button>
          ))}
        </div>
        {selectedNumbers.length !== 6 && (
          <p className="text-xs text-gray-400 mt-3 text-center">
            번호 6개를 선택하면 시뮬레이션을 시작할 수 있습니다
          </p>
        )}
      </section>

      {/* Results */}
      {result && (
        <>
          <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">시뮬레이션 결과</h2>

            {/* Summary */}
            <div
              className={`${
                netProfit >= 0
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              } border rounded-xl p-6 mb-6 text-center`}
            >
              <p className="text-sm text-gray-600 mb-1">
                {result.drawCount.toLocaleString()}회 시뮬레이션 결과
              </p>
              <p
                className={`text-3xl font-bold ${
                  netProfit >= 0 ? "text-green-700" : "text-red-600"
                }`}
              >
                {netProfit >= 0 ? "+" : ""}
                {formatKRW(Math.abs(netProfit))}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                수익률:{" "}
                <span
                  className={`font-bold ${
                    netProfit >= 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {roi}%
                </span>
              </p>
            </div>

            {/* Breakdown */}
            <div className="divide-y divide-gray-100 mb-6">
              <Row label="투자 금액" value={formatKRW(result.totalSpent)} />
              <Row label="총 당첨금" value={formatKRW(result.totalWon)} />
              <Row
                label="순수익"
                value={`${netProfit >= 0 ? "+" : "-"}${formatKRW(Math.abs(netProfit))}`}
                highlight
                positive={netProfit >= 0}
              />
              {result.bestTier && (
                <Row label="최고 등수" value={`${result.bestTier}등`} />
              )}
            </div>

            {/* Win Breakdown Table */}
            <h3 className="font-semibold text-gray-900 mb-3">등수별 당첨 내역</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-3 py-2 border border-gray-200 font-semibold">등수</th>
                    <th className="text-center px-3 py-2 border border-gray-200 font-semibold">당첨 횟수</th>
                    <th className="text-right px-3 py-2 border border-gray-200 font-semibold">당첨금 합계</th>
                  </tr>
                </thead>
                <tbody>
                  {result.wins.map((w) => (
                    <tr key={w.tier}>
                      <td className="px-3 py-2 border border-gray-200">{TIER_LABELS[w.tier]}</td>
                      <td className="text-center px-3 py-2 border border-gray-200">
                        {w.count > 0 ? (
                          <span className="font-bold text-blue-600">{w.count.toLocaleString()}회</span>
                        ) : (
                          <span className="text-gray-400">0회</span>
                        )}
                      </td>
                      <td className="text-right px-3 py-2 border border-gray-200">
                        {w.totalPrize > 0 ? formatKRW(w.totalPrize) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-gray-400 mt-3">
              * 1~3등 당첨금은 역대 평균 추정치입니다. 실제 당첨금은 매회 달라집니다.
            </p>
          </section>

          {/* Share & Retry */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={handleCopy}
              className="flex-1 bg-gray-100 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-200 transition-colors text-sm"
            >
              📋 복사하기
            </button>
            <button
              onClick={handleKakaoShare}
              className="flex-1 bg-[#FEE500] text-[#191919] font-medium py-3 rounded-xl hover:brightness-95 transition-all text-sm"
            >
              💬 카카오톡 공유
            </button>
            <button
              onClick={() => setResult(null)}
              className="flex-1 bg-blue-500 text-white font-medium py-3 rounded-xl hover:bg-blue-600 transition-colors text-sm"
            >
              🔄 다시하기
            </button>
          </div>
        </>
      )}

      {/* Info Section */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">시뮬레이터 안내</h2>
        <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">이용 방법</h3>
            <ol className="list-decimal pl-5 space-y-1">
              <li>1~45 중 6개의 번호를 선택하거나 &quot;자동 선택&quot;을 클릭하세요.</li>
              <li>시뮬레이션 횟수를 선택하면 가상 추첨이 시작됩니다.</li>
              <li>결과를 확인하고 친구에게 공유해보세요!</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">당첨 확률</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>1등:</strong> 1/8,145,060 (6개 번호 일치)</li>
              <li><strong>2등:</strong> 1/1,357,510 (5개 + 보너스)</li>
              <li><strong>3등:</strong> 1/35,724 (5개 일치)</li>
              <li><strong>4등:</strong> 1/733 (4개 일치)</li>
              <li><strong>5등:</strong> 1/45 (3개 일치)</li>
            </ul>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-xs text-yellow-800">
            본 시뮬레이터는 실제 추첨과 동일한 무작위 방식을 사용합니다.
            1~3등 당첨금은 역대 평균 추정치이며, 실제 당첨금은 매회 달라집니다.
            시뮬레이션 결과는 참고용이며, 실제 복권 구매 결과를 보장하지 않습니다.
          </div>
        </div>
      </section>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
  positive,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  positive?: boolean;
}) {
  return (
    <div
      className={`flex justify-between items-center py-2.5 px-1 ${
        highlight ? "bg-blue-50 -mx-1 px-2 rounded-lg" : ""
      }`}
    >
      <span className={`text-sm ${highlight ? "font-semibold text-gray-900" : "text-gray-600"}`}>
        {label}
      </span>
      <span
        className={`text-sm ${
          highlight
            ? `font-bold text-lg ${positive ? "text-green-700" : "text-red-600"}`
            : "text-gray-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
