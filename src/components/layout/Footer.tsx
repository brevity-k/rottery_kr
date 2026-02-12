import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🎯</span>
              <span className="text-lg font-bold text-white">로또리</span>
            </div>
            <p className="text-sm leading-relaxed">
              한국 복권 번호 추천 및 당첨번호 분석 서비스입니다.
              통계 기반의 스마트한 번호 추천을 경험해보세요.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">서비스</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/lotto" className="hover:text-white transition-colors">로또 6/45</Link></li>
              <li><Link href="/lotto/recommend" className="hover:text-white transition-colors">번호 추천</Link></li>
              <li><Link href="/lotto/results" className="hover:text-white transition-colors">당첨번호 조회</Link></li>
              <li><Link href="/lotto/stats" className="hover:text-white transition-colors">통계 분석</Link></li>
              <li><Link href="/lotto/tax" className="hover:text-white transition-colors">세금 계산기</Link></li>
              <li><Link href="/lotto/simulator" className="hover:text-white transition-colors">시뮬레이터</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">블로그</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">정보</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white transition-colors">소개</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">개인정보처리방침</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">이용약관</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">문의하기</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <p className="text-xs text-center text-gray-500">
            본 사이트의 번호 추천은 통계적 분석을 기반으로 한 참고 자료이며, 당첨을 보장하지 않습니다.
            복권 구매는 개인의 판단과 책임 하에 이루어져야 합니다.
          </p>
          <p className="text-xs text-center text-gray-600 mt-4">
            &copy; {new Date().getFullYear()} 로또리 (Rottery). All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
