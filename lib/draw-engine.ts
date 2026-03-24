// lib/draw-engine.ts — Core draw logic (random + algorithmic)

export type DrawMode = "random" | "algorithmic";

/**
 * Generate 5 winning numbers (1–45, no repeats)
 */
export function generateWinningNumbers(
  mode: DrawMode,
  userScores: number[] = []
): number[] {
  if (mode === "random") {
    return randomDraw();
  }
  return algorithmicDraw(userScores);
}

/** Standard random lottery draw */
function randomDraw(): number[] {
  const pool = Array.from({ length: 45 }, (_, i) => i + 1);
  const picked: number[] = [];
  while (picked.length < 5) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked.sort((a, b) => a - b);
}

/**
 * Algorithmic draw — weighted by frequency of user scores.
 * Numbers that appear more often in user scores get higher weight,
 * creating a draw more likely to produce matches.
 */
function algorithmicDraw(userScores: number[]): number[] {
  if (userScores.length === 0) return randomDraw();

  // Build frequency map
  const freq: Record<number, number> = {};
  for (const s of userScores) {
    freq[s] = (freq[s] || 0) + 1;
  }

  // Build weighted pool
  const weighted: number[] = [];
  for (let n = 1; n <= 45; n++) {
    const weight = 1 + (freq[n] || 0) * 3; // Popular numbers get extra weight
    for (let w = 0; w < weight; w++) {
      weighted.push(n);
    }
  }

  // Draw 5 unique numbers from weighted pool
  const picked: number[] = [];
  const remaining = [...weighted];
  while (picked.length < 5) {
    const idx = Math.floor(Math.random() * remaining.length);
    const num = remaining[idx];
    if (!picked.includes(num)) {
      picked.push(num);
    }
    remaining.splice(idx, 1);
    if (remaining.length === 0) break;
  }

  // Pad with random if needed (edge case)
  while (picked.length < 5) {
    const r = Math.floor(Math.random() * 45) + 1;
    if (!picked.includes(r)) picked.push(r);
  }

  return picked.sort((a, b) => a - b);
}

/**
 * Count how many of a user's scores match the winning numbers
 */
export function countMatches(userScores: number[], winningNumbers: number[]): number {
  const winSet = new Set(winningNumbers);
  return userScores.filter(s => winSet.has(s)).length;
}

/**
 * Determine prize tier from match count
 */
export function getPrizeTier(matchCount: number): "five_match" | "four_match" | "three_match" | null {
  if (matchCount >= 5) return "five_match";
  if (matchCount === 4) return "four_match";
  if (matchCount === 3) return "three_match";
  return null;
}

/**
 * Calculate prize amount for a winner in a tier, split among multiple winners
 */
export function calculatePrize(
  tier: "five_match" | "four_match" | "three_match",
  pools: { jackpot: number; fourMatch: number; threeMatch: number },
  winnersInTier: number
): number {
  if (winnersInTier === 0) return 0;
  const pool = tier === "five_match" ? pools.jackpot
    : tier === "four_match" ? pools.fourMatch
    : pools.threeMatch;
  return Math.floor((pool / winnersInTier) * 100) / 100;
}

export interface SimulationEntry {
  userId: string;
  scores: number[];
}

export interface SimulationResult {
  winningNumbers: number[];
  fiveMatchWinners: string[];
  fourMatchWinners: string[];
  threeMatchWinners: string[];
  totalDistributed: number;
  jackpotRollsOver: boolean;
}

/**
 * Run a full simulation against all subscriber entries
 */
export function simulateDraw(
  entries: SimulationEntry[],
  mode: DrawMode,
  pools: { jackpot: number; fourMatch: number; threeMatch: number },
  allUserScores: number[] = []
): SimulationResult {
  const winningNumbers = generateWinningNumbers(mode, allUserScores);

  const fiveMatch: string[] = [];
  const fourMatch: string[] = [];
  const threeMatch: string[] = [];

  for (const entry of entries) {
    const matches = countMatches(entry.scores, winningNumbers);
    const tier = getPrizeTier(matches);
    if (tier === "five_match") fiveMatch.push(entry.userId);
    else if (tier === "four_match") fourMatch.push(entry.userId);
    else if (tier === "three_match") threeMatch.push(entry.userId);
  }

  const jackpotRollsOver = fiveMatch.length === 0;

  const fivePrize = jackpotRollsOver ? 0 : calculatePrize("five_match", pools, fiveMatch.length) * fiveMatch.length;
  const fourPrize = calculatePrize("four_match", pools, fourMatch.length) * fourMatch.length;
  const threePrize = calculatePrize("three_match", pools, threeMatch.length) * threeMatch.length;

  return {
    winningNumbers,
    fiveMatchWinners: fiveMatch,
    fourMatchWinners: fourMatch,
    threeMatchWinners: threeMatch,
    totalDistributed: fivePrize + fourPrize + threePrize,
    jackpotRollsOver,
  };
}
