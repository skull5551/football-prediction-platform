export function calculatePoints(
  actualHome: number,
  actualAway: number,
  predHome: number,
  predAway: number
): number {
  const actualDiff = actualHome - actualAway;
  const predDiff = predHome - predAway;

  if (predHome === actualHome && predAway === actualAway) {
    return 3;
  }

  const sameSign = (a: number, b: number): boolean =>
    (a > 0 && b > 0) || (a < 0 && b < 0) || (a === 0 && b === 0);

  if (sameSign(actualDiff, predDiff)) {
    if (predHome === actualHome || predAway === actualAway) {
      return 2;
    }
    return 1;
  }

  return 0;
}

export default calculatePoints;
