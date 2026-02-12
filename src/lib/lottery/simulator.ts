export interface WinTierResult {
  tier: number;
  count: number;
  totalPrize: number;
}

export interface SimulationResult {
  totalSpent: number;
  totalWon: number;
  drawCount: number;
  wins: WinTierResult[];
  bestTier: number | null;
}

const TICKET_PRICE = 1000;

const PRIZE_AMOUNTS: Record<number, number> = {
  1: 2_000_000_000,
  2: 50_000_000,
  3: 1_500_000,
  4: 50_000,
  5: 5_000,
};

export function simulateDraw(): { numbers: number[]; bonus: number } {
  const pool: number[] = [];
  for (let i = 1; i <= 45; i++) pool.push(i);

  // Fisher-Yates shuffle for first 7
  for (let i = pool.length - 1; i > pool.length - 8; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const picked = pool.slice(pool.length - 7);
  const numbers = picked.slice(0, 6).sort((a, b) => a - b);
  const bonus = picked[6];

  return { numbers, bonus };
}

export function checkWinTier(
  playerNumbers: number[],
  drawNumbers: number[],
  bonusNumber: number
): number | null {
  const drawSet = new Set(drawNumbers);
  const matchCount = playerNumbers.filter((n) => drawSet.has(n)).length;
  const bonusMatch = playerNumbers.includes(bonusNumber);

  if (matchCount === 6) return 1;
  if (matchCount === 5 && bonusMatch) return 2;
  if (matchCount === 5) return 3;
  if (matchCount === 4) return 4;
  if (matchCount === 3) return 5;
  return null;
}

export function getPrizeAmount(tier: number): number {
  return PRIZE_AMOUNTS[tier] ?? 0;
}

export function runSimulation(
  playerNumbers: number[],
  drawCount: number
): SimulationResult {
  const winCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let bestTier: number | null = null;

  for (let i = 0; i < drawCount; i++) {
    const { numbers, bonus } = simulateDraw();
    const tier = checkWinTier(playerNumbers, numbers, bonus);
    if (tier !== null) {
      winCounts[tier]++;
      if (bestTier === null || tier < bestTier) {
        bestTier = tier;
      }
    }
  }

  const wins: WinTierResult[] = [];
  let totalWon = 0;

  for (let tier = 1; tier <= 5; tier++) {
    const count = winCounts[tier];
    const totalPrize = count * getPrizeAmount(tier);
    totalWon += totalPrize;
    wins.push({ tier, count, totalPrize });
  }

  return {
    totalSpent: drawCount * TICKET_PRICE,
    totalWon,
    drawCount,
    wins,
    bestTier,
  };
}
