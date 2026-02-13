import { BlogPost } from "@/types/lottery";
import fs from "fs";
import path from "path";

let cachedPosts: BlogPost[] | null = null;

function loadBlogPosts(): BlogPost[] {
  if (cachedPosts) return cachedPosts;

  const dir = path.join(process.cwd(), "content/blog");
  if (!fs.existsSync(dir)) {
    cachedPosts = [];
    return cachedPosts;
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  const posts = files
    .map((file) => {
      try {
        const raw = fs.readFileSync(path.join(dir, file), "utf-8");
        const post = JSON.parse(raw) as BlogPost;

        if (!post.slug || !post.title || !post.content || !post.date || !post.description || !post.category) {
          console.warn(`Skipping invalid blog post (missing required fields): ${file}`);
          return null;
        }

        return post;
      } catch (err) {
        console.error(`Failed to parse blog post ${file}: ${err}`);
        return null;
      }
    })
    .filter((p): p is BlogPost => p !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  cachedPosts = posts;
  return cachedPosts;
}

export function getAllBlogPosts(): BlogPost[] {
  return loadBlogPosts();
}

export function getBlogPost(slug: string): BlogPost | null {
  return loadBlogPosts().find((p) => p.slug === slug) ?? null;
}

export function getRecentBlogPosts(count: number = 5): BlogPost[] {
  return loadBlogPosts().slice(0, count);
}

export function parsePredictionSlug(slug: string): number | null {
  const match = slug.match(/^(\d+)-prediction$/);
  return match ? parseInt(match[1], 10) : null;
}
