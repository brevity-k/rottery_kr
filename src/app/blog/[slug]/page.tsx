import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllBlogPosts, getBlogPost } from "@/lib/blog";
import { markdownToHtml } from "@/lib/utils/markdown";
import AdBanner from "@/components/ads/AdBanner";

export function generateStaticParams() {
  return getAllBlogPosts().map((post) => ({ slug: post.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const post = getBlogPost(params.slug);
  if (!post) return { title: "글을 찾을 수 없습니다" };

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
    },
  };
}

export default function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = getBlogPost(params.slug);
  if (!post) notFound();

  const contentHtml = markdownToHtml(post.content);
  const allPosts = getAllBlogPosts();
  const relatedPosts = allPosts
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/blog"
        className="text-sm text-blue-600 hover:text-blue-700 mb-6 inline-block"
      >
        &larr; 블로그 목록으로
      </Link>

      <article>
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {post.category}
            </span>
            <span className="text-xs text-gray-400">{post.date}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            {post.title}
          </h1>
          <p className="text-gray-600">{post.description}</p>
        </div>

        <AdBanner slot="blog-detail-top" format="horizontal" className="mb-6" />

        <div
          className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-strong:text-gray-900 prose-li:text-gray-700 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-blockquote:border-blue-400 prose-blockquote:text-gray-600 prose-hr:border-gray-200"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        <div className="flex gap-2 mt-8 pt-6 border-t border-gray-200">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      </article>

      <AdBanner
        slot="blog-detail-bottom"
        format="horizontal"
        className="mt-8"
      />

      {relatedPosts.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            다른 글 읽기
          </h2>
          <div className="space-y-3">
            {relatedPosts.map((rp) => (
              <Link
                key={rp.slug}
                href={`/blog/${rp.slug}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm hover:border-blue-300 transition-all"
              >
                <span className="text-xs text-gray-400">{rp.date}</span>
                <h3 className="font-semibold text-gray-900 text-sm mt-1">
                  {rp.title}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
