import type { Metadata } from "next";
import Link from "next/link";
import { getAllBlogPosts } from "@/lib/blog";
import AdBanner from "@/components/ads/AdBanner";

export const metadata: Metadata = {
  title: "블로그",
  description:
    "로또 6/45 당첨번호 분석, 통계 심층분석, 번호 선택 전략 등 유용한 정보를 제공합니다.",
};

export default function BlogPage() {
  const posts = getAllBlogPosts();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">블로그</h1>
      <p className="text-gray-600 mb-8">
        로또 당첨번호 분석, 통계 심층분석, 전략 가이드 등 유용한 글을
        만나보세요.
      </p>

      <AdBanner slot="blog-top" format="horizontal" className="mb-8" />

      {posts.length === 0 ? (
        <p className="text-gray-500 text-center py-12">
          아직 작성된 글이 없습니다.
        </p>
      ) : (
        <div className="space-y-6">
          {posts.map((post, index) => (
            <div key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="block bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {post.category}
                  </span>
                  <span className="text-xs text-gray-400">{post.date}</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  {post.title}
                </h2>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {post.description}
                </p>
                <div className="flex gap-2 mt-3">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </Link>
              {index === 2 && (
                <AdBanner
                  slot="blog-mid"
                  format="horizontal"
                  className="mt-6"
                />
              )}
            </div>
          ))}
        </div>
      )}

      <AdBanner slot="blog-bottom" format="horizontal" className="mt-8" />
    </div>
  );
}
