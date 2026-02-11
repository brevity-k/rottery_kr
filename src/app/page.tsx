import Link from "next/link";
import { getLatestRound, getLottoResult, getRecentResults } from "@/lib/api/dhlottery";
import { calculateStats } from "@/lib/lottery/stats";
import { getRecentBlogPosts } from "@/lib/blog";
import LottoResultCard from "@/components/lottery/LottoResultCard";
import AdBanner from "@/components/ads/AdBanner";
import LottoBall from "@/components/lottery/LottoBall";

const lotteryTypes = [
  {
    name: "로또 6/45",
    desc: "1~45 중 6개 번호 선택",
    href: "/lotto",
    icon: "🎱",
    color: "bg-blue-50 border-blue-200 hover:border-blue-400",
  },
  {
    name: "번호 추천",
    desc: "AI 통계 기반 번호 추천",
    href: "/lotto/recommend",
    icon: "🤖",
    color: "bg-purple-50 border-purple-200 hover:border-purple-400",
  },
  {
    name: "당첨번호 조회",
    desc: "전 회차 당첨번호 확인",
    href: "/lotto/results",
    icon: "🔍",
    color: "bg-green-50 border-green-200 hover:border-green-400",
  },
  {
    name: "통계 분석",
    desc: "번호별 출현 빈도 분석",
    href: "/lotto/stats",
    icon: "📊",
    color: "bg-amber-50 border-amber-200 hover:border-amber-400",
  },
];

export default function Home() {
  const latestRound = getLatestRound();
  const latestResult = getLottoResult(latestRound);
  const recentResults = getRecentResults(50);
  const stats = calculateStats(recentResults, 10);
  const recentPosts = getRecentBlogPosts(3);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero */}
      <section className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          🎯 로또리 - 스마트한 번호 추천
        </h1>
        <p className="text-gray-600 text-lg mb-8">
          통계 기반 분석으로 로또 번호를 추천받으세요
        </p>

        {latestResult && (
          <div className="max-w-lg mx-auto">
            <LottoResultCard result={latestResult} showDetails size="lg" />
          </div>
        )}

        <Link
          href="/lotto/recommend"
          className="inline-block mt-6 bg-blue-600 text-white font-semibold px-8 py-4 rounded-xl hover:bg-blue-700 transition-colors text-lg shadow-lg shadow-blue-600/25"
        >
          지금 바로 번호 추천받기 →
        </Link>
      </section>

      <AdBanner slot="home-top" format="horizontal" className="mb-10" />

      {/* Lottery Types Grid */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">서비스 바로가기</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {lotteryTypes.map((type) => (
            <Link
              key={type.href}
              href={type.href}
              className={`${type.color} border rounded-2xl p-5 text-center transition-all hover:shadow-md`}
            >
              <span className="text-3xl block mb-2">{type.icon}</span>
              <h3 className="font-bold text-gray-900 mb-1">{type.name}</h3>
              <p className="text-xs text-gray-500">{type.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Stats */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 최근 출현 통계</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">🔥 최근 자주 나온 번호</h3>
            <div className="flex gap-2 flex-wrap">
              {stats.hottestNumbers.map((num) => (
                <LottoBall key={num} number={num} size="lg" />
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">❄️ 최근 적게 나온 번호</h3>
            <div className="flex gap-2 flex-wrap">
              {stats.coldestNumbers.map((num) => (
                <LottoBall key={num} number={num} size="lg" />
              ))}
            </div>
          </div>
        </div>
      </section>

      <AdBanner slot="home-mid" format="horizontal" className="mb-10" />

      {/* Recent Results */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">최근 당첨번호</h2>
          <Link
            href="/lotto/results"
            className="text-blue-600 text-sm font-medium hover:text-blue-700"
          >
            전체보기 →
          </Link>
        </div>
        <div className="space-y-4">
          {recentResults.slice(0, 5).map((result) => (
            <LottoResultCard key={result.drwNo} result={result} />
          ))}
        </div>
      </section>

      <AdBanner slot="home-bottom" format="horizontal" className="mb-10" />

      {/* Recent Blog Posts */}
      {recentPosts.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">최근 블로그 글</h2>
            <Link
              href="/blog"
              className="text-blue-600 text-sm font-medium hover:text-blue-700"
            >
              전체보기 &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
              >
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {post.category}
                </span>
                <h3 className="font-bold text-gray-900 mt-2 mb-1 text-sm line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-xs text-gray-500">{post.date}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Info Section for SEO */}
      <section className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">로또리 소개</h2>
        <div className="prose prose-gray max-w-none text-sm leading-relaxed space-y-3">
          <p>
            <strong>로또리</strong>는 한국 로또 6/45의 당첨번호 조회, 통계 분석, 번호 추천 서비스를 제공합니다.
            역대 전 회차 당첨번호 데이터를 기반으로 번호별 출현 빈도, 홀짝 비율, 구간 분포 등
            다양한 통계를 분석하여 스마트한 번호 추천을 제공합니다.
          </p>
          <p>
            랜덤 추천부터 통계 기반 추천, 핫넘버, 콜드넘버, 균형 추천, AI 종합 추천까지
            6가지 추천 방식으로 나에게 맞는 번호를 찾아보세요.
          </p>
          <p className="text-xs text-gray-400">
            ※ 본 사이트의 번호 추천은 통계적 분석을 기반으로 한 참고 자료이며, 당첨을 보장하지 않습니다.
          </p>
        </div>
      </section>
    </div>
  );
}
