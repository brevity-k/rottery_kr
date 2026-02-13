/**
 * Health check script to validate the entire automation pipeline.
 * Checks data freshness, integrity, blog posts, and critical files.
 *
 * Run: npx tsx scripts/health-check.ts
 */

import * as fs from "fs";
import * as path from "path";
import type { LottoDataFile } from "../src/types/lottery";
import { DATA_PATH, BLOG_DIR, validateDrawData, validateBlogContent, getKSTDate } from "./lib/shared";

/** Health check thresholds (days). */
const DATA_FRESHNESS_FAIL_DAYS = 10;
const DATA_FRESHNESS_WARN_DAYS = 7;
const BLOG_FRESHNESS_FAIL_DAYS = 14;

interface CheckResult {
  name: string;
  status: "pass" | "fail" | "warn";
  message: string;
}

interface HealthReport {
  timestamp: string;
  overall: "healthy" | "unhealthy";
  checks: CheckResult[];
}

function checkDataFreshness(): CheckResult {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    const data: LottoDataFile = JSON.parse(raw);

    const lastUpdated = new Date(data.lastUpdated);
    const now = getKSTDate();
    const daysSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceUpdate > DATA_FRESHNESS_FAIL_DAYS) {
      return {
        name: "Data Freshness",
        status: "fail",
        message: `Data is ${Math.floor(daysSinceUpdate)} days old (last updated: ${data.lastUpdated}). Max allowed: ${DATA_FRESHNESS_FAIL_DAYS} days.`,
      };
    }

    if (daysSinceUpdate > DATA_FRESHNESS_WARN_DAYS) {
      return {
        name: "Data Freshness",
        status: "warn",
        message: `Data is ${Math.floor(daysSinceUpdate)} days old (last updated: ${data.lastUpdated}).`,
      };
    }

    return {
      name: "Data Freshness",
      status: "pass",
      message: `Data updated ${Math.floor(daysSinceUpdate)} days ago. Latest round: ${data.latestRound}. Total draws: ${data.draws.length}.`,
    };
  } catch (err) {
    return {
      name: "Data Freshness",
      status: "fail",
      message: `Cannot read data file: ${err}`,
    };
  }
}

function checkDataIntegrity(): CheckResult {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    const data: LottoDataFile = JSON.parse(raw);

    if (data.draws.length === 0) {
      return {
        name: "Data Integrity",
        status: "fail",
        message: "No draws found in data file.",
      };
    }

    // Sample check: validate first 10, middle 10, and last 10 draws
    const mid = Math.floor(data.draws.length / 2);
    const sampled = [
      ...data.draws.slice(0, 10),
      ...data.draws.slice(Math.max(0, mid - 5), mid + 5),
      ...data.draws.slice(-10),
    ];

    // Use shared validation for consistent checks
    const validation = validateDrawData(sampled);
    if (!validation.valid) {
      // Filter out sequential round errors (expected for sampled data)
      const realErrors = validation.errors.filter(
        (e) => !e.startsWith("Missing round(s)")
      );
      if (realErrors.length > 0) {
        return {
          name: "Data Integrity",
          status: "fail",
          message: `Found ${realErrors.length} integrity issues: ${realErrors.slice(0, 3).join("; ")}`,
        };
      }
    }

    return {
      name: "Data Integrity",
      status: "pass",
      message: `All sampled draws valid. ${data.draws.length} total draws, rounds 1-${data.latestRound}.`,
    };
  } catch (err) {
    return {
      name: "Data Integrity",
      status: "fail",
      message: `Cannot validate data: ${err}`,
    };
  }
}

function checkBlogPosts(): CheckResult {
  try {
    if (!fs.existsSync(BLOG_DIR)) {
      return {
        name: "Blog Posts",
        status: "fail",
        message: "Blog directory does not exist.",
      };
    }

    const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".json"));

    if (files.length === 0) {
      return {
        name: "Blog Posts",
        status: "fail",
        message: "No blog posts found.",
      };
    }

    // Validate blog post structure and find the most recent post
    let latestDate = "";
    let invalidCount = 0;
    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
        const post = JSON.parse(raw);

        if (!post.slug || !post.title || !post.content || !post.date || !post.description || !post.category) {
          invalidCount++;
        } else if (validateBlogContent(post.content).length > 0) {
          invalidCount++;
        }

        if (post.date > latestDate) latestDate = post.date;
      } catch {
        invalidCount++;
      }
    }

    if (invalidCount > 0) {
      return {
        name: "Blog Posts",
        status: "warn",
        message: `${invalidCount} of ${files.length} blog posts are invalid or incomplete.`,
      };
    }

    if (latestDate) {
      const daysSince = (getKSTDate().getTime() - new Date(latestDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > BLOG_FRESHNESS_FAIL_DAYS) {
        return {
          name: "Blog Posts",
          status: "fail",
          message: `Latest blog post is ${Math.floor(daysSince)} days old (${latestDate}). Max allowed: ${BLOG_FRESHNESS_FAIL_DAYS} days. Total posts: ${files.length}.`,
        };
      }
    }

    return {
      name: "Blog Posts",
      status: "pass",
      message: `${files.length} blog posts found. Latest: ${latestDate}.`,
    };
  } catch (err) {
    return {
      name: "Blog Posts",
      status: "fail",
      message: `Cannot check blog posts: ${err}`,
    };
  }
}

function checkCriticalFiles(): CheckResult {
  const criticalFiles = [
    // Data
    "src/data/lotto.json",
    // Core layout and config
    "src/app/layout.tsx",
    "src/app/page.tsx",
    "src/app/not-found.tsx",
    "src/app/sitemap.ts",
    "package.json",
    "next.config.ts",
    "tsconfig.json",
    "postcss.config.mjs",
    // API routes
    "src/app/api/contact/route.ts",
    // Feature pages
    "src/app/lotto/page.tsx",
    "src/app/lotto/recommend/page.tsx",
    "src/app/lotto/results/page.tsx",
    "src/app/lotto/results/[round]/page.tsx",
    "src/app/lotto/stats/page.tsx",
    "src/app/lotto/tax/page.tsx",
    "src/app/lotto/simulator/page.tsx",
    "src/app/lotto/lucky/page.tsx",
    "src/app/lotto/numbers/page.tsx",
    "src/app/lotto/numbers/[num]/page.tsx",
    "src/app/blog/page.tsx",
    "src/app/blog/[slug]/page.tsx",
    "src/app/faq/page.tsx",
    "src/app/about/page.tsx",
    "src/app/privacy/page.tsx",
    "src/app/terms/page.tsx",
    "src/app/contact/page.tsx",
    // Shared components
    "src/components/layout/Header.tsx",
    "src/components/layout/Footer.tsx",
    "src/components/lottery/LottoBall.tsx",
    "src/components/lottery/LottoResultCard.tsx",
    "src/components/lottery/RecommendResult.tsx",
    "src/components/lottery/ResultsCountdown.tsx",
    "src/components/blog/PredictionResults.tsx",
    // Data loading
    "src/lib/api/dhlottery.ts",
    "src/lib/blog.ts",
    // Business logic
    "src/lib/lottery/recommend.ts",
    "src/lib/lottery/stats.ts",
    "src/lib/lottery/simulator.ts",
    "src/lib/lottery/tax.ts",
    // Constants and utilities
    "src/lib/constants.ts",
    "src/lib/utils/format.ts",
    "src/lib/utils/kst.ts",
    "src/lib/utils/kakao.ts",
    "src/lib/utils/markdown.ts",
    // Types
    "src/types/lottery.ts",
    // Automation
    "scripts/update-data.ts",
    "scripts/generate-blog-post.ts",
    "scripts/generate-prediction.ts",
    "scripts/health-check.ts",
    "scripts/lib/shared.ts",
    "scripts/blog-topics.json",
  ];

  const missing: string[] = [];
  for (const file of criticalFiles) {
    const fullPath = path.join(process.cwd(), file);
    if (!fs.existsSync(fullPath)) {
      missing.push(file);
    }
  }

  if (missing.length > 0) {
    return {
      name: "Critical Files",
      status: "fail",
      message: `Missing ${missing.length} critical files: ${missing.join(", ")}`,
    };
  }

  return {
    name: "Critical Files",
    status: "pass",
    message: `All ${criticalFiles.length} critical files present.`,
  };
}

function runHealthCheck(): void {
  console.log("🏥 Running health check...\n");

  const checks: CheckResult[] = [
    checkDataFreshness(),
    checkDataIntegrity(),
    checkBlogPosts(),
    checkCriticalFiles(),
  ];

  const hasFail = checks.some((c) => c.status === "fail");

  const report: HealthReport = {
    timestamp: getKSTDate().toISOString(),
    overall: hasFail ? "unhealthy" : "healthy",
    checks,
  };

  // Human-readable output
  for (const check of checks) {
    const icon = check.status === "pass" ? "✅" : check.status === "warn" ? "⚠️" : "❌";
    console.log(`${icon} ${check.name}: ${check.message}`);
  }

  console.log(`\n${hasFail ? "❌" : "✅"} Overall: ${report.overall.toUpperCase()}`);

  // JSON output
  console.log(`\n📋 JSON Report:`);
  console.log(JSON.stringify(report, null, 2));

  if (hasFail) {
    process.exit(1);
  }
}

runHealthCheck();
