import type { Metadata } from "next";
import Link from "next/link";
import { getLottoResult, getLatestRound } from "@/lib/api/dhlottery";
import LottoResultCard from "@/components/lottery/LottoResultCard";
import AdBanner from "@/components/ads/AdBanner";

export const metadata: Metadata = {
  title: "로또 6/45 - 당첨번호 조회 및 번호 추천",
  description:
    "로또 6/45 최신 당첨번호 확인, 통계 기반 번호 추천, 출현 빈도 분석까지 한 곳에서 확인하세요.",
  alternates: { canonical: "/lotto" },
};

const features = [
  {
    icon: "🤖",
    title: "번호 추천",
    desc: "6가지 알고리즘으로 스마트한 번호 추천",
    href: "/lotto/recommend",
    cta: "추천받기",
  },
  {
    icon: "🔍",
    title: "당첨번호 조회",
    desc: "1회부터 최신 회차까지 전체 당첨번호",
    href: "/lotto/results",
    cta: "조회하기",
  },
  {
    icon: "📊",
    title: "통계 분석",
    desc: "번호별 출현 빈도, 홀짝, 구간 분석",
    href: "/lotto/stats",
    cta: "분석보기",
  },
  {
    icon: "💰",
    title: "세금 계산기",
    desc: "당첨금 실수령액과 세금을 간편하게 계산",
    href: "/lotto/tax",
    cta: "계산하기",
  },
  {
    icon: "🎰",
    title: "시뮬레이터",
    desc: "로또를 사면 얼마나 벌까? 직접 체험",
    href: "/lotto/simulator",
    cta: "체험하기",
  },
  {
    icon: "🍀",
    title: "오늘의 행운 번호",
    desc: "매일 바뀌는 오늘의 행운 번호 확인",
    href: "/lotto/lucky",
    cta: "확인하기",
  },
  {
    icon: "🔢",
    title: "번호별 통계",
    desc: "1~45 각 번호의 출현 빈도 상세 분석",
    href: "/lotto/numbers",
    cta: "확인하기",
  },
];

export default function LottoPage() {
  const latestRound = getLatestRound();
  const latestResult = getLottoResult(latestRound);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">🎱 로또 6/45</h1>
      <p className="text-gray-600 mb-8">
        1부터 45까지의 숫자 중 6개를 선택하는 대한민국 대표 복권
      </p>

      {latestResult && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">최신 당첨번호</h2>
          <LottoResultCard result={latestResult} showDetails size="lg" />
        </section>
      )}

      <AdBanner slot="lotto-top" format="horizontal" className="mb-8" />

      <section className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-all group"
            >
              <span className="text-3xl block mb-3">{f.icon}</span>
              <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{f.desc}</p>
              <span className="text-blue-600 text-sm font-medium group-hover:text-blue-700">
                {f.cta} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-4">로또 6/45 안내</h2>
        <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">추첨 방법</h3>
            <p>1부터 45까지의 숫자 중 당첨번호 6개와 보너스 번호 1개를 추첨합니다.</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">추첨 일시</h3>
            <p>매주 토요일 오후 8시 45분 (MBC 생방송)</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">당첨 등급</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>1등:</strong> 6개 번호 일치 (확률: 1/8,145,060)</li>
              <li><strong>2등:</strong> 5개 + 보너스 번호 일치</li>
              <li><strong>3등:</strong> 5개 번호 일치</li>
              <li><strong>4등:</strong> 4개 번호 일치 (고정 당첨금 50,000원)</li>
              <li><strong>5등:</strong> 3개 번호 일치 (고정 당첨금 5,000원)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">복권 가격</h3>
            <p>1게임 1,000원 (1장당 최대 5게임)</p>
          </div>
        </div>
      </section>
    </div>
  );
}
