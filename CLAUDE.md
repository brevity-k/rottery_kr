# CLAUDE.md - Lottery.kr Project Documentation

## Project Overview

**Site:** lottery.io.kr (Korean lottery number recommendation)
**Repo:** github.com/brevity-k/lottery_kr
**Stack:** Next.js 16 App Router + TypeScript + Tailwind CSS 4 + Chart.js
**Hosting:** Vercel (free tier) — DEPLOYED & LIVE
**Domain:** lottery.io.kr (registered at Gabia, DNS pointing to Vercel)
**Data Source:** superkts.com (pre-fetched to local JSON)
**Email:** Resend (contact form auto-reply)
**Language:** Korean only
**Revenue Model:** Google AdSense
**Analytics:** Google Analytics 4 (G-TCRP4JXV63)
**Contact:** brevity1s.wos@gmail.com

---

## Quick Commands

```bash
npm run dev                 # Start dev server (localhost:3000)
npm run build               # Build for production (runs update-data first via prebuild)
npm run update-data         # Fetch latest lottery data from superkts.com
npm run generate-blog       # Generate a blog post via Claude Haiku API (needs ANTHROPIC_API_KEY)
npm run generate-prediction # Generate prediction post for next draw (needs ANTHROPIC_API_KEY)
npm run health-check        # Run health checks (data freshness, integrity, blog, critical files)
npm run lint                # Run ESLint
```

---

## Architecture

### Static-First Design

All lottery data is pre-fetched at build time. Zero runtime API calls (except contact form).

```
scripts/update-data.ts  -->  src/data/lotto.json  -->  Build-time reads via fs.readFileSync
content/blog/*.json     -->  src/lib/blog.ts      -->  Build-time reads via fs.readFileSync
```

- `prebuild` script runs `update-data` before every `next build` — gracefully degrades if network unavailable (uses existing data)
- Data is cached in memory after first read (`dhlottery.ts`, `blog.ts`)
- `dhlottery.ts` falls back to `lotto.json.bak` if primary file is corrupted
- `blog.ts` skips malformed JSON files instead of crashing the build
- `sitemap.ts` uses try-catch so data loading failures don't block sitemap generation
- All pages are statically generated, including `/lotto/results/[round]` and `/blog/[slug]` via `generateStaticParams()`
- Only dynamic route: `/api/contact` (serverless function for email)

### Data Flow

1. `scripts/update-data.ts` scrapes superkts.com meta descriptions + HTML body in batches of 10
2. Saves to `src/data/lotto.json` (currently ~1,210 rounds, ~252KB, includes prize amounts)
3. `src/lib/api/dhlottery.ts` reads JSON file synchronously at build time
4. `src/lib/blog.ts` reads blog post JSON files from `content/blog/` at build time
5. Pages and components consume data through exported functions

---

## Directory Structure

```
lottery_kr/
├── CLAUDE.md                          # This file
├── PLAN.md                            # Original project plan (14 sections)
├── package.json                       # Dependencies and scripts
├── next.config.ts                     # Next.js configuration
├── tsconfig.json                      # TypeScript configuration
├── postcss.config.mjs                 # PostCSS + Tailwind
├── public/
│   ├── robots.txt                     # Search engine crawl rules (lottery.io.kr)
│   └── ads.txt                        # AdSense publisher verification
├── scripts/
│   ├── lib/
│   │   └── shared.ts                  # Shared utilities (paths, constants, KST dates, withRetry, withTimeout, ensureDir, buildLotteryContext, validateDrawData, validateBlogContent, getDrawNumbers, loadLottoData)
│   ├── update-data.ts                 # Fetches lottery data (retry + validation + backup + 30s timeout)
│   ├── generate-blog-post.ts          # Generates blog post via Claude Haiku API (uses shared retry + validation)
│   ├── generate-prediction.ts         # Generates weekly prediction post (uses shared retry + validation)
│   ├── health-check.ts               # Validates data freshness, integrity, blog, critical files (29 files)
│   └── blog-topics.json               # 12 topic templates for blog rotation
├── content/
│   └── blog/                          # Blog post JSON files (auto-generated weekly)
├── .github/
│   └── workflows/
│       ├── update-data.yml            # Weekly data update (Sunday 00:00 KST) + retry + failure notification
│       ├── generate-blog-post.yml     # Weekly blog generation (Sunday 10:00 KST) + retry + failure notification
│       ├── generate-prediction.yml    # Weekly prediction post (Friday 19:00 KST) + retry + failure notification
│       └── health-check.yml           # Health monitoring (after workflows + Monday 12:00 KST)
└── src/
    ├── data/
    │   └── lotto.json                 # Pre-fetched lottery data (all rounds, with prizes)
    ├── types/
    │   └── lottery.ts                 # TypeScript type definitions (LottoResult, LottoDataFile, BlogPost, etc.)
    ├── lib/
    │   ├── api/
    │   │   └── dhlottery.ts           # Lottery data loading (reads from local JSON)
    │   ├── blog.ts                    # Blog data loading (reads from content/blog/*.json, skips malformed)
    │   ├── constants.ts               # App-wide constants (SITE_URL, SITE_NAME, OWNER_EMAIL, GA4_MEASUREMENT_ID, KAKAO_APP_KEY, LOTTO_*, LOTTO_SECTIONS, LOTTO_TICKET_PRICE)
    │   ├── lottery/
    │   │   ├── recommend.ts           # 6 recommendation algorithms (uses LOTTO_SECTIONS from constants)
    │   │   ├── stats.ts               # Statistical calculations (exports getDrawNumbers)
    │   │   ├── simulator.ts           # Lottery simulator (uses LOTTO_TICKET_PRICE from constants)
    │   │   └── tax.ts                 # Lottery tax calculation (uses LOTTO_TICKET_PRICE from constants)
    │   └── utils/
    │       ├── format.ts              # Korean formatting utilities
    │       ├── kakao.ts               # Shared Kakao SDK initialization (getKakaoSDK, global Window.Kakao type)
    │       ├── kst.ts                 # KST timezone utility (getKSTDate)
    │       └── markdown.ts            # Zero-dependency markdown-to-HTML converter (exports escapeHtml)
    ├── components/
    │   ├── layout/
    │   │   ├── Header.tsx             # Responsive header with mobile menu (includes 오늘의 행운)
    │   │   └── Footer.tsx             # 3-column footer with links (includes 오늘의 행운 번호)
    │   ├── lottery/
    │   │   ├── LottoBall.tsx          # Colored ball (official 5-color scheme)
    │   │   ├── LottoResultCard.tsx    # Result display card (prize per winner + total)
    │   │   ├── RecommendResult.tsx    # Client component with copy/KakaoTalk share/Web Share
    │   │   └── ResultsCountdown.tsx   # 3-phase countdown (before draw → after draw → results available)
    │   ├── blog/
    │   │   └── PredictionResults.tsx  # Shows actual results on prediction posts when available
    │   ├── charts/
    │   │   └── FrequencyChart.tsx     # Chart.js bar chart
    │   └── ads/
    │       └── AdBanner.tsx           # AdSense wrapper (placeholder in dev)
    └── app/
        ├── layout.tsx                 # Root layout (Korean, Pretendard font, GA4, Kakao SDK)
        ├── page.tsx                   # Homepage (includes 최근 블로그 글 section)
        ├── not-found.tsx              # 404 page
        ├── sitemap.ts                 # Dynamic sitemap (lotto rounds + blog posts)
        ├── globals.css                # Tailwind imports + custom styles
        ├── api/
        │   └── contact/route.ts       # Contact form API (Resend email + auto-reply)
        ├── lotto/
        │   ├── page.tsx               # Lotto landing page
        │   ├── recommend/
        │   │   ├── page.tsx           # Number recommendation (server)
        │   │   └── RecommendClient.tsx # Recommendation UI (client)
        │   ├── results/
        │   │   ├── page.tsx           # Latest 20 results
        │   │   └── [round]/page.tsx   # Round detail (statically generated)
        │   ├── stats/page.tsx         # Statistics & frequency analysis
        │   ├── lucky/
        │   │   ├── page.tsx           # Daily lucky numbers (server, metadata)
        │   │   └── LuckyClient.tsx    # Daily lucky numbers (client, deterministic PRNG)
        │   └── tax/
        │       ├── page.tsx           # Tax calculator (server, metadata)
        │       └── TaxCalculatorClient.tsx # Tax calculator UI (client)
        ├── blog/
        │   ├── page.tsx               # Blog list page
        │   └── [slug]/page.tsx        # Blog detail (async params, statically generated)
        ├── about/page.tsx             # About page
        ├── privacy/page.tsx           # Privacy policy
        ├── terms/page.tsx             # Terms of service
        └── contact/
            ├── page.tsx               # Contact page (server, metadata)
            └── ContactForm.tsx        # Contact form (client component)
```

---

## Recommendation Algorithms

Six methods implemented in `src/lib/lottery/recommend.ts`:

| Method | Korean Name | Description |
|--------|-------------|-------------|
| `random` | 랜덤 추천 | Pure random from 1-45 |
| `statistics` | 통계 기반 | Weighted by all-time frequency |
| `hot` | 핫넘버 기반 | Weighted by recent 20-draw frequency (3x multiplier) |
| `cold` | 콜드넘버 기반 | Inverse recent frequency weighting |
| `balanced` | 균형 추천 | 1 number per section (1-9, 10-18, 19-27, 28-36, 37-45) + odd/even balance |
| `ai` | AI 종합 추천 | Composite: 20% all-time + 25% hot + 15% cold + 30% random + balance filter |

---

## KakaoTalk Share (IMPLEMENTED)

Dedicated KakaoTalk share button on `/lotto/recommend` using the Kakao JavaScript SDK.

### Integration

- **Kakao JS SDK:** v2.7.4 loaded via `next/script` (`afterInteractive`) in `layout.tsx`
- **App Key:** `accfcea8c90806c685d4321fa93a4501`
- **SDK initialization:** Lazy via `getKakaoSDK()` from `src/lib/utils/kakao.ts` — centralizes `Window.Kakao` type declaration and init logic for all 3 share components (RecommendResult, LuckyClient, SimulatorClient)

### Share Message

Uses `Kakao.Share.sendDefault()` with `objectType: 'text'`:
- Text: `🎯 로또리 번호 추천\n\nA세트: 1, 7, 12, 25, 33, 41\nB세트: ...`
- Link: `https://lottery.io.kr/lotto/recommend`

### Button Layout (RecommendResult.tsx)

3-button layout: 📋 복사하기 (gray) | 💬 카카오톡 공유 (yellow `#FEE500`) | 📱 공유하기 (blue, Web Share API)

### Prerequisites

- Domain `lottery.io.kr` must be registered in Kakao Developers console (My Application > Platform > Web > Site Domain)

---

## Lottery Tax Calculator (IMPLEMENTED)

Interactive tax calculator at `/lotto/tax` following Korean tax rules (effective 2023-01-01).

### Tax Brackets

| Prize Amount | Income Tax | Local Tax | Total |
|---|---|---|---|
| <= 200만원 | 0% | 0% | 0% (비과세) |
| 200만원 초과 ~ 3억원 | 20% | 2% | 22% |
| 3억원 초과 portion | 30% | 3% | 33% |

- Necessary expense deduction: 1,000원 (ticket cost) before tax calculation
- Progressive brackets: first 3억 at 22%, excess at 33%

### Components

- **`src/lib/lottery/tax.ts`** — Pure tax calculation functions (`calculateLotteryTax()`)
- **`src/app/lotto/tax/page.tsx`** — Server component (metadata + SEO)
- **`src/app/lotto/tax/TaxCalculatorClient.tsx`** — Client component (input, presets, breakdown table, tax rules info)

### Features

- Input field with comma-formatted numbers
- 6 preset buttons (5천원 ~ 20억원)
- Detailed breakdown: 당첨금, 필요경비, 과세대상, 소득세, 지방소득세, 세금합계, 실수령액, 실효세율
- Tax rules reference section with 2023 changes and prize claim info
- Linked from header nav, footer, and lotto landing page (4th feature card)

---

## Auto Blog Post Generation (IMPLEMENTED & VERIFIED)

### Architecture

```
GitHub Actions (cron: Sunday 10:00 KST)
  --> scripts/update-data.ts (refresh lottery data)
  --> scripts/generate-blog-post.ts (Claude Haiku 4.5 API)
  --> content/blog/{slug}.json
  --> git commit & push
  --> Vercel rebuild (static pages including new blog post)
```

### Blog Data Flow

1. Blog posts are stored as JSON files in `content/blog/`
2. `src/lib/blog.ts` reads all JSON files at build time (mirrors `dhlottery.ts` pattern with fs.readFileSync + cache)
3. `src/lib/utils/markdown.ts` converts markdown content to HTML (zero dependencies)
4. `/blog` list page and `/blog/[slug]` detail pages are statically generated via `generateStaticParams()`
5. Blog URLs are included in `sitemap.ts`, nav header, footer, and homepage

**Important:** `/blog/[slug]/page.tsx` uses `async` params (`Promise<{ slug: string }>`) as required by Next.js 16.

### Blog Post Format (JSON)

```json
{
  "slug": "1210-draw-analysis",
  "title": "제1210회 로또 당첨번호 분석",
  "description": "Short description for SEO",
  "content": "Markdown content here...",
  "date": "2026-02-09",
  "category": "당첨번호 분석",
  "tags": ["1210회", "당첨번호", "통계분석"]
}
```

### Resilience Features

- **Retry with exponential backoff:** `withRetry()` from `scripts/lib/shared.ts` — 3 attempts with 1s/2s/4s delay
- **Content validation:** Checks minimum length (800+ chars), AI disclaimer presence, markdown headings
- **Duplicate prevention:** Skips generation if output slug file already exists (exits cleanly)
- **Increased output:** `max_tokens: 4000`, prompt targets 1500-2500 words for better SEO ranking

### Topic Rotation

12 topic templates in `scripts/blog-topics.json`:

| Topic ID | Description |
|----------|-------------|
| `draw-analysis` | Latest round draw analysis (priority if not yet written) |
| `weekly-trend` | Weekly trend analysis with hot/cold numbers |
| `number-deep-dive` | Deep analysis of a specific number |
| `section-analysis` | Section-by-section frequency analysis |
| `odd-even-analysis` | Odd/even ratio pattern analysis |
| `consecutive-numbers` | Consecutive number probability analysis |
| `first-timer-guide` | Beginner's guide to lottery |
| `historical-jackpot` | Historical jackpot records |
| `prediction-preview` | Next round prediction analysis with recommended sets |
| `dream-numbers` | Dream interpretation lottery number guide |
| `comparison-analysis` | Lotto vs pension lottery comparison |
| `sum-range-analysis` | Winning number sum range analysis |

The script auto-selects: draw analysis for new rounds first, then rotates other topics by week number.

### Current Blog Posts (9+)

| Slug | Category | Description |
|------|----------|-------------|
| `1210-draw-analysis` | 당첨번호 분석 | Round 1210 draw analysis |
| `lotto-number-selection-strategies` | 전략 가이드 | 5 number selection strategies |
| `understanding-lotto-probability` | 교육 | Lottery probability explained |
| `gamblers-fallacy` | 수학과 확률 | Gambler's Fallacy and independence |
| `expected-value-lottery` | 수학과 확률 | Expected value of a 1,000 won ticket |
| `birthday-paradox-lottery` | 수학과 확률 | Birthday paradox applied to lottery |
| `law-of-large-numbers` | 수학과 확률 | Convergence proven with 1,200 draws |
| `monte-carlo-simulation-lottery` | 수학과 확률 | Simulating 1M lottery purchases |
| `historical-jackpot-2026-02-11` | 역대 잭팟 | Historical jackpot records (auto-generated) |

New posts are added weekly by GitHub Actions (see workflow section).

### Schedule & Cost

- **Blog posts:** Weekly (Sunday 10:00 KST via GitHub Actions cron)
- **Prediction posts:** Weekly (Friday 19:00 KST via GitHub Actions cron)
- **Model:** Claude Haiku 4.5 (`claude-haiku-4-5-20251001`)
- **Cost:** ~$1.76/year for ~104 posts (2/week: 1 blog + 1 prediction)
- **Manual trigger:** `workflow_dispatch` enabled on all GitHub Actions workflows

### SEO Best Practices

- Every post grounded in real data from `lotto.json`
- 12 different topic templates for variety
- Each post targets distinct long-tail keywords
- AI disclaimer included: "이 글은 AI 분석 도구의 도움을 받아 작성되었으며, 실제 당첨 데이터를 기반으로 합니다."
- Monitor Google Search Console and Naver Search Advisor

---

## GitHub Actions Workflows

All workflows include: retry with 60s delay on first failure, auto-create GitHub Issue (with `automation-failure` label) on final failure, duplicate issue prevention.

### 1. Data Update (`update-data.yml`)

- **Schedule:** Saturday 15:00 UTC = Sunday 00:00 KST (after Saturday lottery draw)
- **Action:** Fetches latest lottery data, validates, commits `src/data/lotto.json` if changed
- **Permissions:** `contents: write`, `issues: write`
- **Trigger:** Also available via `workflow_dispatch`

### 2. Blog Generation (`generate-blog-post.yml`)

- **Schedule:** Sunday 01:00 UTC = Sunday 10:00 KST
- **Action:** Updates data (commits separately) + generates blog post via Claude API + commits blog post
- **Permissions:** `contents: write`, `issues: write`
- **Requires:** `ANTHROPIC_API_KEY` GitHub Actions secret
- **Resilience:** Data update committed independently so it's not lost if blog generation fails

### 3. Prediction Generation (`generate-prediction.yml`)

- **Schedule:** Friday 10:00 UTC = Friday 19:00 KST (before Saturday draw)
- **Action:** Updates data (commits separately) + generates prediction post for next round + commits
- **Permissions:** `contents: write`, `issues: write`
- **Requires:** `ANTHROPIC_API_KEY` GitHub Actions secret
- **Output:** `content/blog/{nextRound}-prediction.json`
- **Resilience:** Data update committed independently so it's not lost if prediction generation fails

### 4. Health Check (`health-check.yml`)

- **Triggers:** After data-update / blog-generation / prediction workflows complete (`workflow_run`), plus weekly Monday 03:00 UTC = Monday 12:00 KST
- **Checks:** Data freshness (>10 days = fail), data integrity via shared `validateDrawData()`, blog posts (>14 days = fail), critical file existence (29 files)
- **Permissions:** `contents: read`, `issues: write`
- **Output:** JSON health report + human-readable summary

### Weekly Automation Timeline

| Day | Time (KST) | Event | Workflow |
|-----|-----------|-------|----------|
| Friday | 19:00 | Generate prediction blog post | `generate-prediction.yml` |
| Saturday | 20:45 | Lotto draw (external) | — |
| Sunday | 00:00 | Fetch new draw data (with retry) | `update-data.yml` |
| Sunday | 10:00 | Generate draw analysis blog post | `generate-blog-post.yml` |
| Monday | 12:00 | Health check (validates everything) | `health-check.yml` |
| Daily | Midnight KST | Lucky numbers auto-rotate | Client-side (no workflow) |

**GitHub Actions usage:** ~10 min/week → ~43 min/month (free tier: 2,000 min/month)

---

## Contact Form & Auto Email (IMPLEMENTED)

### Architecture

```
User fills form → POST /api/contact → Resend API
  → Email to owner (brevity1s.wos@gmail.com)
  → Auto-reply to submitter (confirmation email)
```

### Components

- **`src/app/contact/ContactForm.tsx`** — Client component with form state, validation, success/error handling
- **`src/app/contact/page.tsx`** — Server component with metadata + ContactForm
- **`src/app/api/contact/route.ts`** — API route: validates input, sends 2 emails via Resend

### Email Details

- **To owner:** `[로또리 문의] {subject}` — includes name, email, subject, message
- **Auto-reply:** `[로또리] 문의가 접수되었습니다` — confirms receipt, includes original message

### Required Setup

- Add `RESEND_API_KEY` as Vercel environment variable
- Sign up at [resend.com](https://resend.com) (free: 3,000 emails/month)
- Optional: Add `lottery.io.kr` domain in Resend for branded sender (instead of `onboarding@resend.dev`)

---

## Daily Lucky Numbers (IMPLEMENTED)

Daily-changing lottery numbers at `/lotto/lucky`. Zero API cost — entirely client-side.

### Architecture

- **Deterministic PRNG:** Mulberry32 algorithm seeded with KST date as `YYYYMMDD` integer
- **Same numbers for everyone:** All visitors on the same day see the same 6 numbers
- **Countdown timer:** Shows time until midnight KST when numbers change
- **Hydration-safe:** Uses `mounted` state pattern (same as `DrawCountdown.tsx`)

### Components

- **`src/app/lotto/lucky/page.tsx`** — Server component (metadata + breadcrumb + SEO)
- **`src/app/lotto/lucky/LuckyClient.tsx`** — Client component (PRNG, countdown, share buttons)

### Share Buttons

Same 3-button pattern as `RecommendResult.tsx`: Copy / KakaoTalk / Web Share API

### Navigation

Linked from: Header nav ("오늘의 행운"), Footer (under 서비스), Lotto landing page (feature card), Sitemap (`changeFrequency: "daily"`)

---

## Prediction-to-Results Lifecycle (IMPLEMENTED)

Prediction blog posts are living documents that track the full lifecycle from prediction through draw to results.

### Components

- **`src/components/lottery/ResultsCountdown.tsx`** — Client component with 3-phase countdown
- **`src/components/blog/PredictionResults.tsx`** — Client component that enriches prediction posts with actual results

### 3-Phase Lifecycle

| Phase | Condition | Display |
|-------|-----------|---------|
| `before-draw` | KST < Saturday 20:45 of round's draw week | Blue gradient: countdown to draw |
| `after-draw` | Saturday 20:45 <= KST < Sunday 00:15 | Amber gradient: countdown to results |
| `results-available` | KST >= Sunday 00:15 OR result data exists | Green: actual winning numbers + link to results |

### How It Works

1. **Friday 19:00 KST:** `generate-prediction.yml` creates `{round}-prediction.json` -> Vercel rebuild -> prediction page shows countdown (blue)
2. **Saturday 20:45 KST:** Draw happens -> client auto-transitions to "after-draw" countdown (amber) -> no rebuild needed
3. **Sunday 00:00 KST:** `update-data.yml` fetches new round -> Vercel rebuild -> prediction page shows actual results inline (green)
4. **Blog slug detection:** `parsePredictionSlug()` in `blog.ts` matches `{round}-prediction` pattern
5. **Server-side enrichment:** `blog/[slug]/page.tsx` calls `getLottoResult(round)` to inject results at build time

### Homepage Integration

`ResultsCountdown` renders below `DrawCountdown` on homepage. Self-hides (returns `null`) during Mon-Fri when not relevant. Only visible Saturday evening through Sunday.

### Constants

- `LOTTO_DRAW_HOUR = 20`, `LOTTO_DRAW_MINUTE = 45` — Saturday draw time in KST
- `LOTTO_RESULTS_DELAY_MINUTES = 15` — delay after Sunday 00:00 KST for results availability
- `getDrawDateForRound(round)` in `kst.ts` — calculates Saturday draw date from round number

---

## Self-Sufficient Automation (IMPLEMENTED)

The site runs fully autonomously with zero user intervention. All automation includes retry logic, validation, and failure notifications.

### Shared Automation Utilities (`scripts/lib/shared.ts`)

Single source of truth for all script-side constants and utilities:
- **File paths:** `DATA_PATH`, `BACKUP_PATH`, `BLOG_DIR`, `TOPICS_PATH` — eliminates duplicate path definitions
- **Lottery constants:** `LOTTO_MIN_NUMBER`, `LOTTO_MAX_NUMBER`, `LOTTO_NUMBERS_PER_SET`, `LOTTO_SECTIONS` — same names as `src/lib/constants.ts` (unified naming convention)
- **KST utilities:** `getKSTDate()`, `formatKSTDate()` — mirrors `src/lib/utils/kst.ts` for scripts; all date operations use KST consistently
- **`withRetry()`:** Generic retry with exponential backoff (1s/2s/4s, capped at 30s) — used by all scripts
- **`withTimeout()`:** Promise timeout wrapper (default 120s) — prevents indefinite hangs on API calls
- **`ensureDir()`:** Safe directory creation with error handling — exits with code 1 on failure
- **`buildLotteryContext()`:** Builds recent-draws context string for AI prompts — shared between blog and prediction scripts
- **`validateDrawData()`:** Number range, duplicates, date format, sequential rounds — shared between `update-data.ts` and `health-check.ts`
- **`validateBlogContent()`:** Min length (800 chars), AI disclaimer, markdown headings, markdown structure
- **`getDrawNumbers()`:** Extract 6 numbers from LottoResult — used by all scripts
- **`loadLottoData()`:** Load + parse lotto.json with backup fallback — mirrors `dhlottery.ts` resilience

### Data Pipeline Resilience (`scripts/update-data.ts`)

- **`withRetry()` + `fetchWithTimeout()`:** 3 attempts per round with 30s timeout via AbortController
- **`findLatestRound()`:** Dynamic round detection based on elapsed KST weeks since first draw (2002-12-07) + existing data baseline — no hardcoded limits
- **`validateDrawData()`:** Shared validation from `shared.ts` — numbers 1-45 range, no duplicates, valid dates, sequential rounds
- **`backupExistingData()`:** Copies `lotto.json` → `lotto.json.bak` before overwrite
- **Failed round tracking:** Logs which specific rounds failed to fetch in each batch for debugging
- **Graceful degradation:** If fetch fails, falls back to existing data → then backup file → exits with code 0 (doesn't block builds)
- **Exit code 1** on validation failure (prevents corrupt data from being committed)

### Blog Pipeline Resilience (`scripts/generate-blog-post.ts`)

- **`withRetry()` + `withTimeout()`:** Retry with exponential backoff (capped at 30s) + 120s timeout on Claude API calls — prevents indefinite hangs
- **`validateBlogContent()`:** Checks min length (800 chars), AI disclaimer, markdown headings, markdown structure — **blocks publication on failure** (exit code 1)
- **`ensureDir()`:** Safe blog directory creation with error handling — exits with code 1 on failure
- **Duplicate prevention:** Skips if output slug file exists (exit code 0)
- **Increased output:** `max_tokens: 4000`, targets 1500-2500 words

### Prediction Pipeline (`scripts/generate-prediction.ts`)

- Computes hot/cold numbers from recent 20 draws using shared `getDrawNumbers()`
- Generates 3 AI recommendation sets using shared `LOTTO_SECTIONS` and `LOTTO_MIN_NUMBER`/`LOTTO_MAX_NUMBER` constants
- Rich context prompt with recent 10 draws + statistical analysis
- Built-in duplicate prevention + retry
- **Content validation:** Same `validateBlogContent()` from shared — blocks publication on failure

### Health Monitoring (`scripts/health-check.ts`)

4 automated checks:
1. **Data freshness:** Fail if data >10 days old
2. **Data integrity:** Uses shared `validateDrawData()` on sampled draws (first 10, middle 10, last 10)
3. **Blog posts:** Fail if latest post >14 days old, warn if any posts have invalid JSON or missing required fields
4. **Critical files:** 50 essential files must exist (all pages, dynamic routes, components, business logic, constants, utilities, types, data loaders, config files, automation scripts + shared module)

Outputs JSON report + human-readable summary. Exit code 1 triggers GitHub Issue.

### Workflow Commit Resilience

Blog and prediction workflows commit data updates **separately** before content generation. This ensures data updates are never lost if the AI content generation step fails (even after retry).

---

## Deployment (COMPLETE)

### Current Setup

- **Vercel:** Connected to `github.com/brevity-k/lottery_kr`, auto-deploys on push
- **Domain:** `lottery.io.kr` (Gabia → Vercel DNS)
- **SSL:** Auto-provisioned by Vercel

### DNS Records (at Gabia)

| Type | Host | Value |
|------|------|-------|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |
| TXT | `_vercel` | `vc-domain-verify=...` |

### Environment Variables

#### Vercel (Settings > Environment Variables)

| Key | Purpose |
|-----|---------|
| `RESEND_API_KEY` | Contact form email delivery |
| `ANTHROPIC_API_KEY` | Blog generation (optional, only if running generate-blog on Vercel) |

#### GitHub Actions (Settings > Secrets > Actions)

| Secret | Purpose |
|--------|---------|
| `ANTHROPIC_API_KEY` | Weekly auto blog generation |

### Setup Checklist

- [x] Deploy to Vercel (import GitHub repo)
- [x] Configure DNS for `lottery.io.kr` → Vercel
- [x] SSL certificate (automatic)
- [ ] Add `RESEND_API_KEY` to Vercel environment variables
- [x] Add `ANTHROPIC_API_KEY` to GitHub Actions secrets
- [ ] (Optional) Add `lottery.io.kr` domain to Resend for branded emails

---

## Google Analytics 4 (IMPLEMENTED)

- **Measurement ID:** `G-TCRP4JXV63`
- **Integration:** `next/script` with `afterInteractive` strategy in `layout.tsx`
- **Status:** Live and tracking on lottery.io.kr

---

## Google AdSense Setup

### AdSense Integration Checklist

- [ ] Sign up for Google AdSense
- [ ] Submit site for review (lottery.io.kr)
- [ ] Wait for approval (typically 1-4 weeks)
- [ ] Get Publisher ID (`ca-pub-XXXXXXXXXXXXXXXX`)
- [ ] Update `public/ads.txt` with publisher ID
- [ ] Add AdSense script tag to `layout.tsx`
- [ ] Create ad units in AdSense dashboard
- [ ] Update `AdBanner.tsx` component with real ad unit IDs
- [ ] Test ad display on live site

The site already has AdSense-required pages (`/about`, `/privacy`, `/terms`, `/contact`) and 5+ ad placement slots ready.

---

## Known Issues & Technical Notes

### dhlottery.co.kr API is Blocked

The official lottery API (`dhlottery.co.kr/common.do?method=getLottoNumber`) now returns an HTML page with RSA JavaScript challenge instead of JSON. This is bot protection added sometime in 2025-2026. We use superkts.com as an alternative data source, which scrapes the official data and exposes it via HTML meta tags.

### Prize Amount Parsing

The `update-data.ts` script extracts prize amounts from two sources:
1. **Meta description** (Korean notation): `11억229만8407원씩` → parsed by `parseKoreanAmount()`
2. **HTML body** (exact numbers): `1,102,298,407원` → parsed by `parseCommaNumber()` (preferred, more precise)

The HTML body extraction only runs when `winners > 0` to avoid picking up 2nd prize amounts for rounds with no 1st place winners. `totSellamnt` (total selling amount) is not available from superkts.com and remains 0.

Out of 1,210 rounds: 1,196 have prize data, 14 have `firstWinamnt: 0` (no 1st prize winners — rounds 1, 4, 5, 7, 8, 9, 13, 18, 24, 41, 71, 289, 295, 463).

### Result Card Display

`LottoResultCard.tsx` shows:
- **1등 당첨금 (1인):** per-winner prize from `firstWinamnt`
- **1등 당첨자:** winner count from `firstPrzwnerCo`
- **총 1등 당첨금:** calculated as `firstWinamnt * firstPrzwnerCo`
- Rounds with no winners show "해당 없음"

### Next.js 16 Async Params

In Next.js 16, dynamic route `params` is a `Promise` that must be `await`ed. Both `[round]/page.tsx` and `[slug]/page.tsx` use `params: Promise<{...}>` with `await params`.

### Browser Translation Popup Disabled

iOS Safari and Chrome show automatic translation popups even on Korean-only sites. Three measures in `layout.tsx` prevent this:

- `<html lang="ko" translate="no">` — HTML5 standard attribute
- `<meta name="google" content="notranslate" />` — Chrome-specific suppression
- `<meta httpEquiv="Content-Language" content="ko" />` — Reinforces content language to Safari

### Git Push Authentication

The remote URL includes the GitHub PAT for auth (avoids macOS Keychain conflict with `psychemistz` account):

```
origin https://brevity-k:<PAT>@github.com/brevity-k/lottery_kr.git
```

If the PAT expires, update with:
```bash
git remote set-url origin https://brevity-k:<NEW_PAT>@github.com/brevity-k/lottery_kr.git
```

### Performance

The site was originally making 50-100 API calls per page load to dhlottery.co.kr, causing 30-60 second load times. This was fixed by:
1. Pre-fetching all data to `src/data/lotto.json`
2. Rewriting all data access to use synchronous local file reads
3. Converting all pages from async to sync
4. Adding `generateStaticParams()` for round detail pages

---

## Data Credibility Verification

Data from superkts.com was cross-verified against 4 independent sources for rounds 1208-1210:

### Round 1210 (2026-02-07): 1, 7, 9, 17, 27, 38 + Bonus 31

| Source | Numbers Match | Bonus Match |
|--------|-------------|-------------|
| superkts.com (our source) | Baseline | Baseline |
| kr.lottolyzer.com | Yes | Yes |
| picknum.com | Yes | Yes |
| Korean news (khan.co.kr, mt.co.kr) | Yes | Yes |

**Credibility Rating: HIGH** - 100% consistency across all sources for all tested rounds.

---

## Competitive Analysis & Growth Strategy

### Competitive Landscape

| Site | Monthly Visits | Key Differentiator |
|------|---------------|-------------------|
| **dhlottery.co.kr** (official) | ~33.8M | Only legal online lottery purchase site |
| **lottorich.co.kr** | ~500K-1M | Freemium model, dream interpretation, community |
| **lotto.co.kr** | ~327K | Fortune/zodiac-based numbers |
| **lottoen.com** | ~100K+ | Winning store locator ("명당") — their entire brand |
| **lottoplay.co.kr** | ~49K | Mobile app, countdown timer, social login |
| **pyony.com** | ~30K+ | Multi-lottery, store locator, simulator |
| **lottery.io.kr** (ours) | New | Static-first speed, 6 algorithms, auto-blog, tax calculator |

### Traffic-Driving Features We're Missing (by Impact)

| Priority | Feature | Search Volume | Competitors |
|----------|---------|--------------|-------------|
| **HIGH** | 로또 명당 판매점 찾기 (winning store locator) | 20K+/mo | lottoen, pyony, lottoplay |
| **HIGH** | 연금복권 720+ support | 10K+/mo | pyony, freetto, dhlottery |
| ~~**HIGH**~~ | ~~로또 시뮬레이터 (lottery simulator)~~ | ~~5K+/mo~~ | **DONE** (`/lotto/simulator`) |
| **HIGH** | 꿈해몽 번호 (dream interpretation numbers) | 15K+/mo | lottorich, dedicated apps |
| **MEDIUM** | 운세/별자리 번호 (fortune/zodiac numbers) | 5K+/mo | lotto.co.kr, lottorich |
| ~~**MEDIUM**~~ | ~~오늘의 행운 번호 (daily lucky numbers)~~ | ~~5K+/mo~~ | **DONE** (`/lotto/lucky`) |
| ~~**MEDIUM**~~ | ~~다음 추첨 카운트다운 (countdown timer)~~ | ~~—~~ | **DONE** (homepage) |
| ~~**MEDIUM**~~ | ~~FAQ 페이지 + 구조화된 데이터~~ | ~~Various~~ | **DONE** (`/faq`) |
| **LOW** | Community forum | — | lottorich, lottoplay |
| **LOW** | Mobile app (iOS/Android) | — | lottorich, lottoplay |

### SEO Gaps to Fix

| Issue | Impact | Effort | Status |
|-------|--------|--------|--------|
| ~~No `og:image` on any page — social shares show no preview~~ | ~~High~~ | ~~Low~~ | **FIXED** |
| ~~Sitemap only includes latest 100 rounds (1,110+ excluded)~~ | ~~High~~ | ~~Low~~ | **FIXED** |
| ~~`/lotto/tax` missing from sitemap~~ | ~~Medium~~ | ~~Low~~ | **FIXED** |
| ~~No `FAQPage` JSON-LD structured data~~ | ~~High~~ | ~~Medium~~ | **FIXED** |
| ~~No `BreadcrumbList` structured data~~ | ~~Medium~~ | ~~Low~~ | **FIXED** |
| ~~No per-number detail pages (`/lotto/numbers/[num]`)~~ | ~~High~~ | ~~Medium~~ | **FIXED** |
| Blog posts don't link to site features (internal linking) | Medium | Low | Open |
| Tax calculator not linked from result cards | Medium | Low | Open |
| No Naver Blog cross-posting (70%+ Korean searches on Naver) | Very High | Ongoing | Open |

### UX Improvements Needed

- ~~Replace `alert()` with toast notifications~~ — **DONE** (Toast component)
- Add number generation animation (rolling/revealing effect)
- ~~Add results search/filter and pagination~~ — **DONE**
- ~~Add active navigation state to Header~~ — **DONE**
- ~~Add breadcrumbs on detail pages~~ — **DONE**
- ~~Disable iOS translation popup~~ — **DONE** (`translate="no"`, `notranslate` meta, `Content-Language` meta)
- Improve mobile share button tap targets

---

## Growth Roadmap (Revised)

### Phase 1: COMPLETE
Core Lotto 6/45 — recommendations, stats, results, tax calculator, blog, contact, GA4, KakaoTalk share

### Phase 2: COMPLETE
Quick wins — simulator, SEO fixes, FAQ, countdown, toast notifications, blog post length, self-sufficient automation

| # | Feature | Target Keywords | Status |
|---|---------|----------------|--------|
| 2.1 | **Lottery simulator** (`/lotto/simulator`) | 로또 시뮬레이터 | **DONE** |
| 2.2 | **OG images** — branded preview images for social sharing | — (CTR improvement) | **DONE** |
| 2.3 | **Fix sitemap** — include all 1,210+ rounds + tax page | — (indexing improvement) | **DONE** |
| 2.4 | **FAQ page** (`/faq`) with `FAQPage` JSON-LD | 로또 구매 방법, 당첨금 수령 | **DONE** |
| 2.5 | **실수령액 계산기** branding | 로또 실수령액 | **DONE** |
| 2.6 | **Next draw countdown** on homepage | — (return visits) | **DONE** |
| 2.7 | **Toast notifications** — replace `alert()` with polished toasts | — (UX) | **DONE** |
| 2.8 | **Blog post length** — increase to 1,500-2,500 words | — (SEO) | **DONE** |
| 2.9 | **Self-sufficient automation** — retry, validation, health monitoring | — (reliability) | **DONE** |

### Phase 3: Medium-term (1-3 months, significant traffic growth)

| # | Feature | Target Keywords | Status |
|---|---------|----------------|--------|
| 3.1 | **꿈해몽 번호 생성기** (`/lotto/dream`) — dream symbol → number mapping | 로또 꿈해몽, 꿈 번호 추천 | Not started |
| 3.2 | **오늘의 행운 번호** (`/lotto/lucky`) — daily changing numbers | 오늘의 로또 번호, 행운의 번호 | **DONE** |
| 3.3 | **연금복권 720+** (`/pension/`) — results, stats, recommendations | 연금복권 당첨번호, 연금복권 확률 | Not started |
| 3.4 | **Per-number detail pages** (`/lotto/numbers/[num]`) — 45 new SEO pages | 로또 번호 7 통계, 번호별 출현 빈도 | **DONE** |
| 3.5 | **이번주 예상번호** — auto-generated pre-draw prediction page | 1212회 로또 예상번호 | **DONE** |
| 3.6 | **Naver Blog cross-posting** — 2-3 posts/week, link back to site | — (Naver organic traffic) | Not started |
| 3.7 | **BreadcrumbList + internal linking** improvements | — (SEO) | **DONE** |
| 3.8 | **Number generation animation** — rolling/revealing ball effect | — (engagement) | Not started |
| 3.9 | **Results search/filter/pagination** — search by round, number, date | — (UX, dwell time) | **DONE** |

### Phase 4: Long-term (3-6 months, major features)

| # | Feature | Target Keywords | Status |
|---|---------|----------------|--------|
| 4.1 | **로또 명당 판매점 지도** (`/lotto/stores/`) — Kakao Map integration, public data from data.go.kr | 로또 명당, [지역] 로또 판매점 | Not started |
| 4.2 | **PWA push notifications** — Saturday draw results, weekly recommendations | — (retention, 190% increase) | Not started |
| 4.3 | **운세/별자리 번호** (`/lotto/fortune`) — birthday, zodiac, Chinese zodiac | 로또 운세, 별자리 로또 번호 | Not started |
| 4.4 | **My Numbers** — saved numbers with localStorage, auto-check weekly | — (retention) | Not started |
| 4.5 | **Community features** — comments (Giscus), prediction sharing, leaderboard | — (UGC, engagement) | Not started |
| 4.6 | **KakaoTalk Channel** — weekly draw results + recommendations to subscribers | — (retention) | Not started |
| 4.7 | **YouTube Shorts pipeline** — automated weekly draw result videos | — (new traffic source) | Not started |
| 4.8 | **AdSense approval + ad placement** | — (monetization) | Not started |

### Content Strategy

| Content Type | Target Keywords | Frequency |
|---|---|---|
| Weekly draw analysis | "1211회 당첨번호 분석" | Weekly (automated, Sunday) |
| Pre-draw predictions | "이번주 로또 예상번호" | Weekly (automated, Friday) |
| Dream interpretation guides | "로또 꿈해몽", "돼지꿈 번호" | 2-3/month |
| Winner store stories | "[지역] 로또 명당" | Monthly |
| Comparison content | "로또 vs 연금복권", "로또 vs 주식" | Monthly |
| Purchase/claim guides | "로또 온라인 구매 방법", "당첨금 수령" | Quarterly |
| Seasonal content | "설날 로또", "추석 로또" | Seasonal |

### Social Media Strategy

| Channel | Strategy | Frequency |
|---------|----------|-----------|
| **Naver Blog** | Cross-post abbreviated analysis, link back to site | 2-3/week |
| **KakaoTalk** | Share buttons on all interactive tools, viral loop | Per interaction |
| **YouTube Shorts** | 15-sec draw results, simulator shock videos | Weekly |
| **DCInside 로또갤** | Share genuine analysis, build reputation | Weekly |
| **Threads/Instagram** | Weekly "핫넘버" infographics, draw result 속보 | Weekly |

### Monetization Path

| Phase | Strategy | Expected Revenue |
|-------|----------|-----------------|
| Current | None | $0 |
| After traffic growth | Google AdSense | $50-500/month |
| Parallel | Naver Ad (네이버 광고) | Korea-specific, may outperform AdSense |
| Later | Premium features (ad-free, advanced filters) | $1K+/month at scale |
| Later | Coupang Partners affiliate | Supplementary |

---

## Dependencies

### Production
- `next` ^16.1.6
- `react` / `react-dom` ^19.2.4
- `chart.js` ^4.5.1
- `react-chartjs-2` ^5.3.1
- `@vercel/analytics` ^1.6.1
- `resend` (contact form email)

### Development
- `typescript` ^5
- `tailwindcss` ^4
- `@tailwindcss/postcss` ^4
- `@anthropic-ai/sdk` ^0.74.0
- `tsx` ^4.21.0
- `eslint` ^9
- `eslint-config-next` 16.2.0-canary.35
