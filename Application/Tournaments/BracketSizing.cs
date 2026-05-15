using System;

namespace Application.Tournaments;

/// <summary>
/// Static, integer-safe helpers for N-player single-elim tournament bracket sizing.
///
/// The parameter is consistently named <c>perHeatN</c> (the per-heat player count, 2..4).
/// There is intentionally no ambiguous "playerCount" overload.
///
/// <see cref="TotalRoundsFor"/> is a switch table (NOT <c>Math.Log</c>): base-conversion
/// precision loss (e.g. <c>Math.Log(27, 3) ≈ 2.9999…</c>) would silently produce wrong
/// round counts. Locked 2026-05-13 (B6, skeptical review).
/// </summary>
public static class BracketSizing
{
    public static int[] ValidBracketSizesFor(int perHeatN) => perHeatN switch
    {
        2 => [4, 8, 16, 32],
        3 => [3, 9, 27],
        4 => [4, 8, 16, 32, 64],
        _ => throw new ArgumentException($"Illegal perHeatN={perHeatN}. Must be 2, 3, or 4.")
    };

    public static bool IsLegalRosterCount(int perHeatN, int memberCount)
        => Array.IndexOf(ValidBracketSizesFor(perHeatN), memberCount) >= 0;

    public static int TotalRoundsFor(int perHeatN, int bracketSize) => (perHeatN, bracketSize) switch
    {
        (2, 4) => 2, (2, 8) => 3, (2, 16) => 4, (2, 32) => 5,
        (3, 3) => 1, (3, 9) => 2, (3, 27) => 3,
        (4, 4) => 1, (4, 8) => 2, (4, 16) => 3, (4, 32) => 4, (4, 64) => 5,
        _ => throw new ArgumentException($"Illegal (perHeatN={perHeatN}, bracketSize={bracketSize}). Legal sizes for N={perHeatN}: {string.Join(',', ValidBracketSizesFor(perHeatN))}")
    };

    public static int AdvanceRatio(int perHeatN) => perHeatN switch
    {
        2 => 2,
        3 => 3,
        4 => 2,
        _ => throw new ArgumentException($"Illegal perHeatN={perHeatN}. Must be 2, 3, or 4.")
    };

    public static int AdvancersPerHeat(int perHeatN) => perHeatN switch
    {
        2 => 1,
        3 => 1,
        4 => 2,
        _ => throw new ArgumentException($"Illegal perHeatN={perHeatN}. Must be 2, 3, or 4.")
    };
}
