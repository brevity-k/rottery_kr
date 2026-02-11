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
      const raw = fs.readFileSync(path.join(dir, file), "utf-8");
      return JSON.parse(raw) as BlogPost;
    })
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
