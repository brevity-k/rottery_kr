"use client";

import { useState } from "react";
import { calculateLotteryTax, TaxResult } from "@/lib/lottery/tax";
import { formatKRW } from "@/lib/utils/format";

const presets = [
  { label: "5천원", value: 5_000 },
  { label: "5만원", value: 50_000 },
  { label: "150만원", value: 1_500_000 },
  { label: "5천만원", value: 50_000_000 },
  { label: "10억원", value: 1_000_000_000 },
  { label: "20억원", value: 2_000_000_000 },
];

function formatInputNumber(value: string): string {
  const num = value.replace(/[^0-9]/g, "");
  if (!num) return "";
  return Number(num).toLocaleString();
}

export default function TaxCalculatorClient() {
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState<TaxResult | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatInputNumber(e.target.value);
    setInputValue(formatted);
    setResult(null);
  };

  const handlePreset = (value: number) => {
    setInputValue(value.toLocaleString());
    setResult(null);
  };

  const handleCalculate = () => {
    const amount = Number(inputValue.replace(/,/g, ""));
    if (!amount || amount <= 0) return;
    setResult(calculateLotteryTax(amount));
  };

  const handleReset = () => {
    setInputValue("");
    setResult(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleCalculate();
  };

  return (
    <div>
      {/* Input Section */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">당첨금액 입력</h2>

        <div className="relative mb-4">
          <input
            type="text"
            inputMode="numeric"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="당첨금액을 입력하세요"
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">원</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {presets.map((p) => (
            <button
              key={p.value}
              onClick={() => handlePreset(p.value)}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCalculate}
            disabled={!inputValue}
            className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg shadow-blue-600/25"
          >
            계산하기
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            초기화
          </button>
        </div>
      </section>

      {/* Result Section */}
      {result && (
        <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">계산 결과</h2>

          {/* Net Amount Highlight */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6 text-center">
            <p className="text-sm text-blue-600 mb-1">실수령액</p>
            <p className="text-3xl font-bold text-blue-700">{formatKRW(result.netAmount)}</p>
            {result.totalTax > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                세금 {formatKRW(result.totalTax)} 공제 (실효세율 {result.effectiveRate.toFixed(1)}%)
              </p>
            )}
            {result.totalTax === 0 && (
              <p className="text-sm text-green-600 mt-2">비과세 (200만원 이하)</p>
            )}
          </div>

          {/* Breakdown Table */}
          <div className="divide-y divide-gray-100">
            <Row label="당첨금액" value={formatKRW(result.prizeAmount)} />
            <Row label="필요경비 (복권 구입비)" value={`- ${result.ticketCost.toLocaleString()}원`} sub />
            <Row
              label="과세 대상 금액"
              value={result.taxableAmount > 0 ? formatKRW(result.taxableAmount) : "비과세"}
            />
            <div className="h-2" />
            <Row
              label="소득세"
              value={result.incomeTax > 0 ? `- ${formatKRW(result.incomeTax)}` : "0원"}
              sub={result.incomeTax > 0}
            />
            <Row
              label="지방소득세"
              value={result.localTax > 0 ? `- ${formatKRW(result.localTax)}` : "0원"}
              sub={result.localTax > 0}
            />
            <Row
              label="세금 합계"
              value={result.totalTax > 0 ? `- ${formatKRW(result.totalTax)}` : "0원"}
              bold
            />
            <div className="h-2" />
            <Row label="실수령액" value={formatKRW(result.netAmount)} highlight />
            <Row label="실효세율" value={`${result.effectiveRate.toFixed(1)}%`} />
          </div>
        </section>
      )}

      {/* Tax Rules Info */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">로또 세금 안내</h2>

        <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">당첨금별 세율 (2023년~ 현행)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-3 py-2 border border-gray-200 font-semibold">당첨금</th>
                    <th className="text-center px-3 py-2 border border-gray-200 font-semibold">소득세</th>
                    <th className="text-center px-3 py-2 border border-gray-200 font-semibold">지방소득세</th>
                    <th className="text-center px-3 py-2 border border-gray-200 font-semibold">합계</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-2 border border-gray-200">200만원 이하</td>
                    <td className="text-center px-3 py-2 border border-gray-200">비과세</td>
                    <td className="text-center px-3 py-2 border border-gray-200">비과세</td>
                    <td className="text-center px-3 py-2 border border-gray-200 font-semibold text-green-600">0%</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 border border-gray-200">200만원 초과 ~ 3억원</td>
                    <td className="text-center px-3 py-2 border border-gray-200">20%</td>
                    <td className="text-center px-3 py-2 border border-gray-200">2%</td>
                    <td className="text-center px-3 py-2 border border-gray-200 font-semibold">22%</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 border border-gray-200">3억원 초과</td>
                    <td className="text-center px-3 py-2 border border-gray-200">30%</td>
                    <td className="text-center px-3 py-2 border border-gray-200">3%</td>
                    <td className="text-center px-3 py-2 border border-gray-200 font-semibold">33%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-1">2023년 세법 변경사항</h3>
            <p>
              2023년 1월 1일부터 복권 비과세 기준이 기존 5만원에서 <strong>200만원</strong>으로 대폭 상향되었습니다.
              따라서 4등(5만원)과 3등(약 150만원)은 세금 없이 전액 수령 가능합니다.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-1">필요경비 공제</h3>
            <p>
              복권 구입비 1,000원은 필요경비로 인정되어 과세 대상 금액에서 차감됩니다.
              예를 들어, 당첨금이 1,000만원이면 과세 대상은 999만 9,000원입니다.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-1">당첨금 수령 안내</h3>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li><strong>1등:</strong> NH농협은행 본점에서 수령 (신분증 + 당첨 복권)</li>
              <li><strong>2등, 3등:</strong> NH농협은행 전국 지점에서 수령</li>
              <li><strong>4등, 5등:</strong> 복권 판매점 또는 NH농협은행에서 수령</li>
              <li><strong>수령 기한:</strong> 추첨일로부터 <strong>1년 이내</strong> (기한 초과 시 복권기금 귀속)</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-xs text-yellow-800">
            본 계산기는 참고용이며, 실제 세금은 개인 상황에 따라 달라질 수 있습니다.
            정확한 세금 계산은 국세청 또는 세무 전문가에게 문의하시기 바랍니다.
          </div>
        </div>
      </section>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  highlight,
  sub,
}: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
  sub?: boolean;
}) {
  return (
    <div
      className={`flex justify-between items-center py-2.5 px-1 ${
        highlight ? "bg-blue-50 -mx-1 px-2 rounded-lg" : ""
      }`}
    >
      <span className={`text-sm ${bold || highlight ? "font-semibold text-gray-900" : "text-gray-600"}`}>
        {label}
      </span>
      <span
        className={`text-sm ${
          highlight
            ? "font-bold text-blue-700 text-lg"
            : bold
            ? "font-semibold text-gray-900"
            : sub
            ? "text-red-500"
            : "text-gray-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
