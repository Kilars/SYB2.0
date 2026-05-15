using System;
using Domain;
using Persistence;

namespace Application.Tournaments;

/// <summary>
/// Shared single-elim bracket generator used by both StartTournament and ShuffleBracket
/// so the generation logic lives in exactly one place.
///
/// <para><b>MatchNumber invariant (B7, locked 2026-05-13):</b>
/// MatchNumber is globally monotonically increasing within a tournament, assigned in
/// iteration order through <c>(BracketNumber ascending, heatIndex ascending)</c>.
/// Concretely, for a heat at zero-based <c>heatIndexInThisRound</c> in round
/// <c>BracketNumber</c>:
/// <code>
/// MatchNumber == (sum of heat counts in all prior rounds) + heatIndexInThisRound + 1
/// </code>
/// This is load-bearing for <c>SlotMapping</c> in task 046b, which derives
/// <c>positionInRound</c> from MatchNumber ordering within a round. ANY future refactor
/// that changes MatchNumber assignment order MUST update SlotMapping in lockstep.</para>
/// </summary>
public static class BracketBuilder
{
    public static void BuildBracket(AppDbContext context, Tournament tournament, List<CompetitionMember> members, int perHeatPlayerCount)
    {
        // Defense-in-depth: caller is responsible for exact-size roster validation.
        if (members.Count != tournament.BracketSize)
            throw new ArgumentException(
                $"Member count ({members.Count}) must equal tournament.BracketSize ({tournament.BracketSize}).");

        context.RemoveRange(context.Rounds.Where(r => r.CompetitionId == tournament.Id));
        context.RemoveRange(context.Matches.Where(m => m.CompetitionId == tournament.Id));

        var rng = new Random();

        // Seed shuffle, then assign Seed = i+1 in shuffled order.
        Shuffle(members, rng);
        for (int i = 0; i < members.Count; i++)
            members[i].Seed = i + 1;

        int bracketSize = tournament.BracketSize;
        int totalRounds = BracketSizing.TotalRoundsFor(perHeatPlayerCount, bracketSize);
        int advanceRatio = BracketSizing.AdvanceRatio(perHeatPlayerCount);
        int roundsPerMatch = perHeatPlayerCount == 2 ? tournament.BestOf : 1;

        int heatsInRound1 = bracketSize / perHeatPlayerCount;
        int matchNumber = 1;

        // ─── Round 1: heats filled via round-robin seed distribution ───────────
        // Heat h receives seeds (h, h + heatsInRound1, h + 2*heatsInRound1, …) so the
        // deepest-seeded players are spread across heats rather than clustered.
        for (int h = 0; h < heatsInRound1; h++)
        {
            var heatMembers = new List<CompetitionMember>(perHeatPlayerCount);
            for (int j = 0; j < perHeatPlayerCount; j++)
                heatMembers.Add(members[h + j * heatsInRound1]);

            // Within the heat, randomize which seed fills which positional slot so no
            // player is permanently "slot 1" across heats (locked 2026-05-13).
            Shuffle(heatMembers, rng);

            var match = new Match
            {
                CompetitionId = tournament.Id,
                BracketNumber = 1,
                MatchNumber = matchNumber,
                PlayerCount = perHeatPlayerCount,
                PlayerOneUserId = heatMembers[0].UserId,
                PlayerTwoUserId = heatMembers[1].UserId,
                PlayerThreeUserId = perHeatPlayerCount >= 3 ? heatMembers[2].UserId : null,
                PlayerFourUserId = perHeatPlayerCount >= 4 ? heatMembers[3].UserId : null,
            };
            context.Matches.Add(match);

            for (int r = 0; r < roundsPerMatch; r++)
            {
                context.Rounds.Add(new Round
                {
                    CompetitionId = tournament.Id,
                    BracketNumber = 1,
                    MatchNumber = matchNumber,
                    RoundNumber = r + 1,
                });
            }
            matchNumber++;
        }

        // ─── Rounds 2..totalRounds: placeholder heats (no participants) ────────
        int previousRoundMatchCount = heatsInRound1;
        for (int round = 2; round <= totalRounds; round++)
        {
            int matchesInRound = previousRoundMatchCount / advanceRatio;
            for (int i = 0; i < matchesInRound; i++)
            {
                var match = new Match
                {
                    CompetitionId = tournament.Id,
                    BracketNumber = round,
                    MatchNumber = matchNumber,
                    PlayerCount = perHeatPlayerCount,
                    PlayerOneUserId = null,
                    PlayerTwoUserId = null,
                    PlayerThreeUserId = null,
                    PlayerFourUserId = null,
                };
                context.Matches.Add(match);

                for (int r = 0; r < roundsPerMatch; r++)
                {
                    context.Rounds.Add(new Round
                    {
                        CompetitionId = tournament.Id,
                        BracketNumber = round,
                        MatchNumber = matchNumber,
                        RoundNumber = r + 1,
                    });
                }
                matchNumber++;
            }
            previousRoundMatchCount = matchesInRound;
        }
    }

    private static void Shuffle<T>(IList<T> list, Random rng)
    {
        int n = list.Count;
        while (n > 1)
        {
            int k = rng.Next(n--);
            (list[n], list[k]) = (list[k], list[n]);
        }
    }
}
