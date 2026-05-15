// Mirrors backend Application/Tournaments/BracketSizing.cs. Kept as explicit
// integer tables (not log2 math): Math.log precision loss would silently break
// N=3 (e.g. log(27,3) ≈ 2.999…). Update in lockstep with the backend.

const TOTAL_ROUNDS_TABLE: Record<string, number> = {
  "2,4": 2, "2,8": 3, "2,16": 4, "2,32": 5,
  "3,3": 1, "3,9": 2, "3,27": 3,
  "4,4": 1, "4,8": 2, "4,16": 3, "4,32": 4, "4,64": 5,
};

const VALID_BRACKET_SIZES: Record<number, number[]> = {
  2: [4, 8, 16, 32],
  3: [3, 9, 27],
  4: [4, 8, 16, 32, 64],
};

export function totalRoundsFor(perHeatN: number, bracketSize: number): number {
  return TOTAL_ROUNDS_TABLE[`${perHeatN},${bracketSize}`] ?? Math.round(Math.log2(bracketSize));
}

export function validBracketSizesFor(perHeatN: number): number[] {
  return VALID_BRACKET_SIZES[perHeatN] ?? [4, 8, 16, 32];
}
