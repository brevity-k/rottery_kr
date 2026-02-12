/**
 * Generates a weekly prediction blog post for the upcoming lottery draw.
 * Runs every Friday before the Saturday draw.
 *
 * Run: ANTHROPIC_API_KEY=sk-... npx tsx scripts/generate-prediction.ts
 */

import Anthropic from "@anthropic-ai/sdk";
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
  firstPrzwnerCo: number;
}

interface LottoDataFile {
  latestRound: number;
  draws: LottoResult[];
}

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  content: string;
  date: string;
  category: string;
  tags: string[];
}

const BLOG_DIR = path.join(process.cwd(), "content/blog");
const DATA_PATH = path.join(process.cwd(), "src/data/lotto.json");

function loadLottoData(): LottoDataFile {
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

function getNumbers(draw: LottoResult): number[] {
  return [
    draw.drwtNo1,
    draw.drwtNo2,
    draw.drwtNo3,
    draw.drwtNo4,
    draw.drwtNo5,
    draw.drwtNo6,
  ];
}

function computeFrequency(draws: LottoResult[]): Map<number, number> {
  const freq = new Map<number, number>();
  for (let i = 1; i <= 45; i++) freq.set(i, 0);
  for (const draw of draws) {
    for (const n of getNumbers(draw)) {
      freq.set(n, (freq.get(n) || 0) + 1);
    }
  }
  return freq;
}

function getTopN(freq: Map<number, number>, n: number, ascending = false): number[] {
  return [...freq.entries()]
    .sort((a, b) => ascending ? a[1] - b[1] : b[1] - a[1])
    .slice(0, n)
    .map(([num]) => num);
}

function generateRecommendedSets(data: LottoDataFile): string {
  const recent20 = data.draws.slice(0, 20);
  const recentFreq = computeFrequency(recent20);
  const allFreq = computeFrequency(data.draws);

  const hotNumbers = getTopN(recentFreq, 10);
  const coldNumbers = getTopN(recentFreq, 10, true);
  const allTimeTop = getTopN(allFreq, 15);

  // Set 1: Hot numbers weighted
  const set1 = pickWeighted(hotNumbers, 6);
  // Set 2: Mix of hot + all-time
  const mixed = [...hotNumbers.slice(0, 5), ...allTimeTop.slice(0, 5)];
  const set2 = pickWeighted([...new Set(mixed)], 6);
  // Set 3: Balanced (1 per section + some cold)
  const set3 = pickBalanced(coldNumbers);

  return [
    `A세트 (핫넘버 기반): ${set1.sort((a, b) => a - b).join(", ")}`,
    `B세트 (종합 분석): ${set2.sort((a, b) => a - b).join(", ")}`,
    `C세트 (균형 추천): ${set3.sort((a, b) => a - b).join(", ")}`,
  ].join("\n");
}

function pickWeighted(pool: number[], count: number): number[] {
  const result: number[] = [];
  const available = [...pool];
  while (result.length < count && available.length > 0) {
    const idx = Math.floor(Math.random() * available.length);
    result.push(available[idx]);
    available.splice(idx, 1);
  }
  // Fill remaining from random if pool too small
  while (result.length < count) {
    const n = Math.floor(Math.random() * 45) + 1;
    if (!result.includes(n)) result.push(n);
  }
  return result;
}

function pickBalanced(coldNumbers: number[]): number[] {
  const sections = [
    [1, 9], [10, 18], [19, 27], [28, 36], [37, 45],
  ];
  const result: number[] = [];
  for (const [min, max] of sections) {
    const coldInSection = coldNumbers.filter((n) => n >= min && n <= max);
    if (coldInSection.length > 0) {
      result.push(coldInSection[Math.floor(Math.random() * coldInSection.length)]);
    } else {
      result.push(min + Math.floor(Math.random() * (max - min + 1)));
    }
  }
  // Add 6th number
  while (result.length < 6) {
    const n = Math.floor(Math.random() * 45) + 1;
    if (!result.includes(n)) result.push(n);
  }
  return result;
}

async function callClaudeWithRetry(
  client: Anthropic,
  params: Anthropic.MessageCreateParamsNonStreaming,
  maxRetries = 3
): Promise<Anthropic.Message> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await client.messages.create(params);
    } catch (err) {
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.warn(`⚠️ API call failed, retrying in ${delay / 1000}s... (attempt ${attempt}/${maxRetries}): ${err}`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
  throw new Error("callClaudeWithRetry: exhausted all retries");
}

async function generatePrediction(): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("❌ ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.");
    process.exit(1);
  }

  const data = loadLottoData();
  const latest = data.draws[0];
  const nextRound = latest.drwNo + 1;
  const slug = `${nextRound}-prediction`;

  // Duplicate prevention
  const outputPath = path.join(BLOG_DIR, `${slug}.json`);
  if (fs.existsSync(outputPath)) {
    console.log(`✅ Prediction already exists: ${outputPath} — skipping.`);
    process.exit(0);
  }

  // Build rich context
  const recent10 = data.draws.slice(0, 10);
  const recentLines = recent10.map((d) => {
    const nums = getNumbers(d);
    return `${d.drwNo}회 (${d.drwNoDate}): ${nums.join(", ")} + 보너스 ${d.bnusNo}`;
  });

  const recent20 = data.draws.slice(0, 20);
  const recentFreq = computeFrequency(recent20);
  const hotNumbers = getTopN(recentFreq, 8);
  const coldNumbers = getTopN(recentFreq, 8, true);

  const recommendedSets = generateRecommendedSets(data);

  const context = `최근 10회차 당첨번호:
${recentLines.join("\n")}

최근 20회차 핫넘버 (출현 빈도 상위): ${hotNumbers.join(", ")}
최근 20회차 콜드넘버 (출현 빈도 하위): ${coldNumbers.join(", ")}

AI 추천 번호 3세트:
${recommendedSets}`;

  console.log(`📝 Generating prediction for round ${nextRound}...`);

  const client = new Anthropic({ apiKey });

  const message = await callClaudeWithRetry(client, {
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: `당신은 한국 로또 6/45 분석 블로그의 전문 작가입니다. 아래 데이터를 참고하여 제${nextRound}회 로또 예상번호 분석 블로그 글을 작성해주세요.

${context}

---

다음 내용을 포함해주세요:
1. 최근 10회차 당첨번호 흐름 요약
2. 핫넘버/콜드넘버 분석 (최근 20회 기준)
3. 구간별 출현 추이 (1-9, 10-18, 19-27, 28-36, 37-45)
4. 홀짝 비율 전망
5. AI 추천 번호 3세트와 각 세트의 선정 근거
6. 종합 전망

작성 규칙:
- 한국어로 작성
- 마크다운 형식 (##, **, -, 등)
- 1500~2500단어
- 제목은 "제${nextRound}회 로또 예상번호 분석"으로 시작
- 데이터에 기반한 사실만 언급
- "예상번호는 통계적 참고자료일 뿐 당첨을 보장하지 않습니다"라는 면책 문구를 반드시 포함
- 마지막에: "이 글은 AI 분석 도구의 도움을 받아 작성되었으며, 실제 당첨 데이터를 기반으로 합니다."`,
      },
    ],
  });

  const content =
    message.content[0].type === "text" ? message.content[0].text : "";

  if (!content) {
    console.error("❌ API에서 빈 응답을 받았습니다.");
    process.exit(1);
  }

  const today = new Date().toISOString().slice(0, 10);
  const title = `제${nextRound}회 로또 예상번호 분석 - 이번 주 추천 번호`;

  const firstParagraph = content
    .split("\n")
    .find((l) => l.trim() && !l.startsWith("#"));
  const description = firstParagraph
    ? firstParagraph.replace(/\*\*/g, "").slice(0, 150).trim()
    : title;

  const post: BlogPost = {
    slug,
    title,
    description,
    content,
    date: today,
    category: "예상번호",
    tags: [`${nextRound}회`, "예상번호", "로또전망", "AI추천", "통계분석"],
  };

  if (!fs.existsSync(BLOG_DIR)) {
    fs.mkdirSync(BLOG_DIR, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(post, null, 2));

  console.log(`✅ Prediction post saved: ${outputPath}`);
  console.log(`   Round: ${nextRound}`);
  console.log(`   Length: ${content.length} chars`);
}

generatePrediction().catch((err) => {
  console.error("❌ Prediction generation failed:", err);
  process.exit(1);
});
