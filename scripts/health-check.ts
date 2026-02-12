/**
 * Health check script to validate the entire automation pipeline.
 * Checks data freshness, integrity, blog posts, and critical files.
 *
 * Run: npx tsx scripts/health-check.ts
 */

import * as fs from "fs";
import * as path from "path";

interface LottoResult {
  drwNo: number;
  drwNoDate: string;
  drwtNo1: number;
  drwtNo2: number;
  drwtNo3: number;
  drwtNo4: number;
  drwtNo5: number;
  drwtNo6: number;
  bnusNo: number;
}

interface LottoDataFile {
  lottery: string;
  lastUpdated: string;
  latestRound: number;
  draws: LottoResult[];
}

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

const DATA_PATH = path.join(process.cwd(), "src/data/lotto.json");
const BLOG_DIR = path.join(process.cwd(), "content/blog");

function checkDataFreshness(): CheckResult {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    const data: LottoDataFile = JSON.parse(raw);

    const lastUpdated = new Date(data.lastUpdated);
    const now = new Date();
    const daysSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceUpdate > 10) {
      return {
        name: "Data Freshness",
        status: "fail",
        message: `Data is ${Math.floor(daysSinceUpdate)} days old (last updated: ${data.lastUpdated}). Max allowed: 10 days.`,
      };
    }

    if (daysSinceUpdate > 7) {
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
    const errors: string[] = [];

    if (data.draws.length === 0) {
      return {
        name: "Data Integrity",
        status: "fail",
        message: "No draws found in data file.",
      };
    }

    // Sample check: validate first 10 and last 10 draws
    const sampled = [
      ...data.draws.slice(0, 10),
      ...data.draws.slice(-10),
    ];

    for (const draw of sampled) {
      const nums = [
        draw.drwtNo1, draw.drwtNo2, draw.drwtNo3,
        draw.drwtNo4, draw.drwtNo5, draw.drwtNo6,
      ];

      for (const n of nums) {
        if (n < 1 || n > 45) {
          errors.push(`Round ${draw.drwNo}: number ${n} out of range`);
        }
      }

      if (draw.bnusNo < 1 || draw.bnusNo > 45) {
        errors.push(`Round ${draw.drwNo}: bonus ${draw.bnusNo} out of range`);
      }

      if (new Set(nums).size !== 6) {
        errors.push(`Round ${draw.drwNo}: duplicate numbers`);
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(draw.drwNoDate)) {
        errors.push(`Round ${draw.drwNo}: invalid date "${draw.drwNoDate}"`);
      }
    }

    if (errors.length > 0) {
      return {
        name: "Data Integrity",
        status: "fail",
        message: `Found ${errors.length} integrity issues: ${errors.slice(0, 3).join("; ")}`,
      };
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

    // Find the most recent post by date
    let latestDate = "";
    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
        const post = JSON.parse(raw);
        if (post.date > latestDate) latestDate = post.date;
      } catch {
        // skip invalid files
      }
    }

    if (latestDate) {
      const daysSince = (Date.now() - new Date(latestDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > 14) {
        return {
          name: "Blog Posts",
          status: "fail",
          message: `Latest blog post is ${Math.floor(daysSince)} days old (${latestDate}). Max allowed: 14 days. Total posts: ${files.length}.`,
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
    "src/data/lotto.json",
    "src/app/layout.tsx",
    "src/app/page.tsx",
    "src/app/lotto/page.tsx",
    "src/app/lotto/recommend/page.tsx",
    "src/app/lotto/results/page.tsx",
    "src/app/lotto/stats/page.tsx",
    "src/app/lotto/tax/page.tsx",
    "src/app/lotto/simulator/page.tsx",
    "src/app/lotto/lucky/page.tsx",
    "src/app/blog/page.tsx",
    "src/app/sitemap.ts",
    "package.json",
    "next.config.ts",
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
    timestamp: new Date().toISOString(),
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
