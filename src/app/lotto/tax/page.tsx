import type { Metadata } from "next";
import TaxCalculatorClient from "./TaxCalculatorClient";
import AdBanner from "@/components/ads/AdBanner";

export const metadata: Metadata = {
  title: "로또 세금 계산기 - 당첨금 실수령액 계산",
  description:
    "로또 당첨금에 대한 세금(소득세, 지방소득세)을 계산하고 실수령액을 확인하세요. 2023년 개정 세법 기준 정확한 복권 세금 계산기.",
  alternates: { canonical: "/lotto/tax" },
};

export default function TaxPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">💰 로또 세금 계산기</h1>
      <p className="text-gray-600 mb-8">
        당첨금을 입력하면 세금과 실수령액을 바로 확인할 수 있습니다.
      </p>

      <AdBanner slot="tax-top" format="horizontal" className="mb-6" />

      <TaxCalculatorClient />

      <AdBanner slot="tax-bottom" format="horizontal" className="mt-6" />
    </div>
  );
}
