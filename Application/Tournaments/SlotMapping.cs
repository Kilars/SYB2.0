using System;
using Domain;

namespace Application.Tournaments;

/// <summary>
/// Pure function: maps a completed heat (identified by its 0-based <c>positionInRound</c>)
/// to the <c>(nextMatchIndex, slotIndices)</c> that should be written in the next round.
///
/// <para><b>positionInRound is 0-based throughout</b> — there is no 1-based variant.
/// It is derived from the ordered heat list in the current bracket round:
/// <code>
/// positionInRound = matchesInThisRound.OrderBy(m => m.MatchNumber).IndexOf(thisMatch)
/// </code>
/// This derivation is load-bearing: <see cref="BracketBuilder"/> assigns MatchNumber
/// monotonically in iteration order through (BracketNumber asc, heatIndex asc), so
/// ordering by MatchNumber within a round produces the same sequence used during bracket
/// construction. <b>ANY future refactor of BracketBuilder that changes MatchNumber
/// assignment order MUST update SlotMapping in lockstep.</b></para>
///
/// <para><b>Topology invariant (B7, locked 2026-05-13):</b>
/// <c>positionInRound = matchesInThisRound.OrderBy(m => m.MatchNumber).IndexOf(thisMatch)</c>.
/// See the companion comment in <c>BracketBuilder</c>.</para>
///
/// <para><b>N=2 / N=3 (top-1 advancement):</b>
/// advanceRatio = <see cref="BracketSizing.AdvanceRatio(int)"/>. Returns
/// <c>(positionInRound / advanceRatio, [positionInRound % advanceRatio])</c>.
/// One slot written: 0 → PlayerOne, 1 → PlayerTwo.
/// N=2 regression: positionInRound 0,1,2,3 → nextMatchIndex 0,0,1,1 ; slotIndex 0,1,0,1
/// — identical to the legacy 1-based formula <c>(pos-1)/2</c> with <c>pos%2==1→P1, else→P2</c>.</para>
///
/// <para><b>N=4 (top-2 cross-pair advancement):</b>
/// Two slots per heat. heatParity = positionInRound % 2.
/// nextMatchIndex = positionInRound / 2.
/// slotIndices = heatParity==0 ? [0, 3] : [1, 2].
/// Interpretation: advancers[0] (winner) fills the "outer" slot; advancers[1] (runner-up)
/// fills the "cross" slot. The locked cross-pair seeding rule (AD#9, 2026-05-13):
/// next.PlayerOne = heatA.winner, next.PlayerTwo = heatB.winner,
/// next.PlayerThree = heatB.runnerUp, next.PlayerFour = heatA.runnerUp.
/// heatA → slotIndices[0,3], heatB → slotIndices[1,2].</para>
/// </summary>
public static class SlotMapping
{
    /// <summary>
    /// Returns the target <c>nextMatchIndex</c> (0-based index into the next round's ordered match list)
    /// and the <c>slotIndices</c> (0-based player-slot indices: 0=PlayerOne…3=PlayerFour) that an
    /// advancer from this heat should be written into.
    ///
    /// <para>Advancer list length must equal <c>slotIndices.Length</c>: one advancer per slot.
    /// Caller pairs advancers[i] with slotIndices[i].</para>
    /// </summary>
    /// <param name="positionInRound">
    /// 0-based index of the completed heat within its bracket round, derived by ordering
    /// all matches in the round by MatchNumber ascending and taking the zero-based indexOf.
    /// </param>
    /// <param name="perHeatPlayerCount">Per-heat player count (2, 3, or 4).</param>
    public static (int nextMatchIndex, int[] slotIndices) For(int positionInRound, int perHeatPlayerCount)
    {
        if (perHeatPlayerCount == 4)
        {
            // N=4: top-2 cross-pair seeding.
            // Two heats feed one next-round heat; nextMatchIndex = positionInRound / 2.
            // heatA (even positions): winner→slot0(PlayerOne), runnerUp→slot3(PlayerFour).
            // heatB (odd  positions): winner→slot1(PlayerTwo), runnerUp→slot2(PlayerThree).
            int nextMatchIndex = positionInRound / 2;
            int heatParity = positionInRound % 2;
            int[] slotIndices = heatParity == 0 ? [0, 3] : [1, 2];
            return (nextMatchIndex, slotIndices);
        }
        else
        {
            // N=2 or N=3: top-1 advancement. advanceRatio heats → 1 next-round heat.
            int advanceRatio = BracketSizing.AdvanceRatio(perHeatPlayerCount);
            int nextMatchIndex = positionInRound / advanceRatio;
            int slotIndex = positionInRound % advanceRatio;
            return (nextMatchIndex, [slotIndex]);
        }
    }

    /// <summary>
    /// Sets the designated 0-based player slot of <paramref name="match"/>:
    /// 0=PlayerOne, 1=PlayerTwo, 2=PlayerThree, 3=PlayerFour. A null
    /// <paramref name="userId"/> clears the slot (used by reopen, the exact
    /// inverse of the fill performed during completion).
    /// </summary>
    public static void SetSlot(Match match, int slotIndex, string? userId)
    {
        switch (slotIndex)
        {
            case 0: match.PlayerOneUserId = userId; break;
            case 1: match.PlayerTwoUserId = userId; break;
            case 2: match.PlayerThreeUserId = userId; break;
            case 3: match.PlayerFourUserId = userId; break;
        }
    }
}
