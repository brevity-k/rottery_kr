# CLAUDE.md - Rottery.kr Project Documentation

## Project Overview

**Site:** lottery.io.kr (Korean lottery number recommendation)
**Repo:** github.com/brevity-k/rottery_kr
**Stack:** Next.js 16 App Router + TypeScript + Tailwind CSS 4 + Chart.js
**Hosting:** Vercel (free tier) — DEPLOYED & LIVE
**Domain:** lottery.io.kr (registered at Gabia, DNS pointing to Vercel)
**Data Source:** superkts.com (pre-fetched to local JSON)
**Email:** Resend (contact form auto-reply)
**Language:** Korean only
**Revenue Model:** Google AdSense
**Contact:** brevity1s.wos@gmail.com

---

## Quick Commands

```bash
npm run dev           # Start dev server (localhost:3000)
npm run build         # Build for production (runs update-data first via prebuild)
npm run update-data   # Fetch latest lottery data from superkts.com
npm run generate-blog # Generate a blog post via Claude Haiku API (needs ANTHROPIC_API_KEY)
npm run lint          # Run ESLint
```

---

## Architecture

### Static-First Design

All lottery data is pre-fetched at build time. Zero runtime API calls (except contact form).

```
scripts/update-data.ts  -->  src/data/lotto.json  -->  Build-time reads via fs.readFileSync
content/blog/*.json     -->  src/lib/blog.ts      -->  Build-time reads via fs.readFileSync
```

- `prebuild` script runs `update-data` before every `next build`
- Data is cached in memory after first read (`dhlottery.ts`, `blog.ts`)
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
rottery_kr/
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
│   ├── update-data.ts                 # Fetches lottery data from superkts.com
│   ├── generate-blog-post.ts          # Generates blog post via Claude Haiku API
│   └── blog-topics.json               # 8 topic templates for blog rotation
├── content/
│   └── blog/                          # Blog post JSON files (8 posts: 3 seed + 5 math)
├── .github/
│   └── workflows/
│       ├── update-data.yml            # Weekly data update (Sunday 00:00 KST)
│       └── generate-blog-post.yml     # Weekly blog generation (Sunday 10:00 KST)
└── src/
    ├── data/
    │   └── lotto.json                 # Pre-fetched lottery data (all rounds, with prizes)
    ├── types/
    │   └── lottery.ts                 # TypeScript type definitions (LottoResult, BlogPost, etc.)
    ├── lib/
    │   ├── api/
    │   │   └── dhlottery.ts           # Lottery data loading (reads from local JSON)
    │   ├── blog.ts                    # Blog data loading (reads from content/blog/*.json)
    │   ├── lottery/
    │   │   ├── recommend.ts           # 6 recommendation algorithms
    │   │   └── stats.ts               # Statistical calculations
    │   └── utils/
    │       ├── format.ts              # Korean formatting utilities
    │       └── markdown.ts            # Zero-dependency markdown-to-HTML converter
    ├── components/
    │   ├── layout/
    │   │   ├── Header.tsx             # Responsive header with mobile menu (includes 블로그)
    │   │   └── Footer.tsx             # 3-column footer with links (includes 블로그)
    │   ├── lottery/
    │   │   ├── LottoBall.tsx          # Colored ball (official 5-color scheme)
    │   │   ├── LottoResultCard.tsx    # Result display card (prize per winner + total)
    │   │   └── RecommendResult.tsx    # Client component with copy/share
    │   ├── charts/
    │   │   └── FrequencyChart.tsx     # Chart.js bar chart
    │   └── ads/
    │       └── AdBanner.tsx           # AdSense wrapper (placeholder in dev)
    └── app/
        ├── layout.tsx                 # Root layout (Korean, Pretendard font)
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
        │   └── stats/page.tsx         # Statistics & frequency analysis
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

## Auto Blog Post Generation (IMPLEMENTED)

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

### Topic Rotation

8 topic templates in `scripts/blog-topics.json`:

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

The script auto-selects: draw analysis for new rounds first, then rotates other topics by week number.

### Current Blog Posts (8)

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

### Schedule & Cost

- **Frequency:** Weekly (Sunday 10:00 KST via GitHub Actions cron)
- **Model:** Claude Haiku 4.5 (`claude-haiku-4-5-20251001`)
- **Cost:** ~$0.88/year for 52 weekly posts
- **Manual trigger:** `workflow_dispatch` enabled in GitHub Actions

### SEO Best Practices

- Every post grounded in real data from `lotto.json`
- 8 different topic templates for variety
- Each post targets distinct long-tail keywords
- AI disclaimer included: "이 글은 AI 분석 도구의 도움을 받아 작성되었으며, 실제 당첨 데이터를 기반으로 합니다."
- Monitor Google Search Console and Naver Search Advisor

---

## GitHub Actions Workflows

### 1. Data Update (`update-data.yml`)

- **Schedule:** Saturday 15:00 UTC = Sunday 00:00 KST (after Saturday lottery draw)
- **Action:** Fetches latest lottery data, commits `src/data/lotto.json` if changed
- **Trigger:** Also available via `workflow_dispatch`

### 2. Blog Generation (`generate-blog-post.yml`)

- **Schedule:** Sunday 01:00 UTC = Sunday 10:00 KST
- **Action:** Updates data + generates blog post via Claude API + commits
- **Requires:** `ANTHROPIC_API_KEY` GitHub Actions secret

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

## Deployment (COMPLETE)

### Current Setup

- **Vercel:** Connected to `github.com/brevity-k/rottery_kr`, auto-deploys on push
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
- [ ] Add `ANTHROPIC_API_KEY` to GitHub Actions secrets
- [ ] (Optional) Add `lottery.io.kr` domain to Resend for branded emails

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

### Git Push Authentication

The remote URL includes the GitHub PAT for auth (avoids macOS Keychain conflict with `psychemistz` account):

```
origin https://brevity-k:<PAT>@github.com/brevity-k/rottery_kr.git
```

If the PAT expires, update with:
```bash
git remote set-url origin https://brevity-k:<NEW_PAT>@github.com/brevity-k/rottery_kr.git
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

## Phase Roadmap (from PLAN.md)

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | COMPLETE | Lotto 6/45 - core site, recommendations, stats, results |
| Phase 2 | Not started | Add pension lottery (연금복권 720+), more lottery types |
| Phase 3 | IN PROGRESS | Blog system (DONE), contact form (DONE), community features, push notifications |
| Phase 4 | Not started | Mobile app (PWA), premium features |

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
