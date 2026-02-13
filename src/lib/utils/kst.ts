/**
 * KST (Korean Standard Time, UTC+9) utilities.
 * Used by countdown timers and daily-changing features.
 */

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function getKSTDate(): Date {
  const now = new Date();
  return new Date(
    now.getTime() + KST_OFFSET_MS + now.getTimezoneOffset() * 60 * 1000
  );
}

/**
 * Calculate the Saturday draw date for a given round number.
 * Round 1 was 2002-12-07 (Saturday). Each subsequent round is 7 days later.
 */
export function getDrawDateForRound(round: number): Date {
  const firstDraw = new Date(2002, 11, 7); // 2002-12-07, Saturday
  const drawDate = new Date(firstDraw);
  drawDate.setDate(drawDate.getDate() + (round - 1) * 7);
  return drawDate;
}
