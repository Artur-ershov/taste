// Elo: online pairwise rating used for live progress feedback during a session.
// Order-dependent and a touch noisy — we re-fit Bradley-Terry at the end for the
// clean ranking — but it updates instantly after every swipe.

export const ELO_BASE = 1500;
const K = 24;

export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
}

/** Returns the updated [ratingA, ratingB] after A either beat or lost to B. */
export function updateElo(
  ratingA: number,
  ratingB: number,
  aWon: boolean,
  k: number = K,
): [number, number] {
  const eA = expectedScore(ratingA, ratingB);
  const sA = aWon ? 1 : 0;
  return [ratingA + k * (sA - eA), ratingB + k * (1 - sA - (1 - eA))];
}
