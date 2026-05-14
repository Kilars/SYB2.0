using System;
using System.Collections.ObjectModel;
using Application.Core;
using Application.Interfaces;
using AutoMapper.Execution;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Leagues.Commands;

public class ChangeLeagueStatus
{
    public class Command : IRequest<Result<Unit>>
    {
        public required string LeagueId { get; set; }
        public required CompetitionStatus NewStatus { get; set; }
        /// <summary>
        /// Required on first Planned→Active transition (when League.PlayerCount is null).
        /// Must match League.PlayerCount on subsequent activations.
        /// Ignored on Active→Planned revert.
        /// </summary>
        public int? PlayerCount { get; set; }
    }
    public class Handler(AppDbContext context) : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            var league = await context.Leagues
                .Include(x => x.Members)
                .FirstOrDefaultAsync(x => x.Id == request.LeagueId, cancellationToken);
            if (league == null) return Result<Unit>.Failure("League not found", 404);
            var members = league.Members.ToList();

            switch ((league.Status, request.NewStatus))
            {
                case (CompetitionStatus.Planned, CompetitionStatus.Active):
                {
                    int n;
                    if (league.PlayerCount.HasValue)
                    {
                        if (request.PlayerCount.HasValue && request.PlayerCount.Value != league.PlayerCount.Value)
                            return Result<Unit>.Failure(
                                $"PlayerCount mismatch: league is configured for N={league.PlayerCount.Value} but request sent N={request.PlayerCount.Value}.", 400);
                        n = league.PlayerCount.Value;
                    }
                    else
                    {
                        n = request.PlayerCount ?? 2;
                        if (n < 2 || n > 4)
                            return Result<Unit>.Failure("PlayerCount must be between 2 and 4.", 400);
                        league.PlayerCount = n;
                    }

                    if (n > 2) league.BestOf = 1;

                    if (members.Count < n)
                        return Result<Unit>.Failure($"League requires at least {n} members to activate.", 400);

                    if (n > 2)
                    {
                        int v = members.Count;
                        int r = (int)Math.Ceiling(2.0 * (v - 1) / (n - 1));
                        if ((r * v) % n != 0)
                        {
                            var legalList = string.Join(", ", ComputeLegalVs(n, maxV: 32));
                            return Result<Unit>.Failure(
                                $"N={n}-player league requires a member count whose schedule total is whole. " +
                                $"Legal counts for N={n} up to 32: {legalList}", 400);
                        }
                    }

                    CreateMatchesBetweenAllPlayers(league, n, new Random());
                    league.Status = CompetitionStatus.Active;
                    break;
                }

                case (CompetitionStatus.Active, CompetitionStatus.Complete):
                    //Archive all matches
                    break;
                case (CompetitionStatus.Complete, CompetitionStatus.Active):
                    //Unarchive all matches
                    break;
                case (CompetitionStatus.Active, CompetitionStatus.Planned):
                    // Delete rounds first (FK NoAction prevents cascade), then matches.
                    // league.PlayerCount is preserved so reactivation reuses the configured N.
                    context.RemoveRange(context.Rounds.Where(r => r.CompetitionId == league.Id));
                    context.RemoveRange(context.Matches.Where(m => m.CompetitionId == league.Id));
                    league.Status = CompetitionStatus.Planned;
                    break;

                default:
                    break;
            }

            var res = await context.SaveChangesAsync(cancellationToken) > 0;

            if (!res) return Result<Unit>.Failure("Could not change status of league", 400);
            return Result<Unit>.Success(Unit.Value);
        }

        private void CreateMatchesBetweenAllPlayers(League league, int n, Random rng)
        {
            if (n == 2) CreateTwoPlayerSchedule(league, rng);
            else CreateFfaSchedule(league, n, rng);
        }

        private void CreateTwoPlayerSchedule(League league, Random rng)
        {
            var firstSplit = new List<Match>();
            var secondSplit = new List<Match>();

            var members = league.Members.ToList();

            // Generate unique pairings (combinations) of players
            for (int i = 0; i < members.Count; i++)
            {
                for (int j = i + 1; j < members.Count; j++)
                {
                    var p1 = members[i].UserId;
                    var p2 = members[j].UserId;

                    // Randomize who goes first in which split for balance
                    bool flip = (i + j) % 2 == 0;

                    firstSplit.Add(new Match
                    {
                        CompetitionId = league.Id,
                        PlayerOneUserId = flip ? p1! : p2!,
                        PlayerTwoUserId = flip ? p2! : p1!,
                        BracketNumber = 1,
                        PlayerCount = 2
                    });

                    secondSplit.Add(new Match
                    {
                        CompetitionId = league.Id,
                        PlayerOneUserId = flip ? p2! : p1!,
                        PlayerTwoUserId = flip ? p1! : p2!,
                        BracketNumber = 2,
                        PlayerCount = 2
                    });
                }
            }
            Shuffle(firstSplit, rng);
            Shuffle(secondSplit, rng);

            var index = 1;
            foreach (var match in firstSplit)
            {
                match.MatchNumber = index;
                index++;
                for (int i = 0; i < league.BestOf; i++)
                {
                    context.Rounds.Add(new Round
                    {
                        CompetitionId = match.CompetitionId,
                        MatchNumber = match.MatchNumber,
                        BracketNumber = match.BracketNumber,
                        RoundNumber = i + 1
                    });
                }
            }
            index = 1;
            foreach (var match in secondSplit)
            {
                match.MatchNumber = index;
                index++;
                for (int i = 0; i < league.BestOf; i++)
                {
                    context.Rounds.Add(new Round
                    {
                        CompetitionId = match.CompetitionId,
                        MatchNumber = match.MatchNumber,
                        BracketNumber = match.BracketNumber,
                        RoundNumber = i + 1
                    });
                }
            }

            context.Matches.AddRange(firstSplit);
            context.Matches.AddRange(secondSplit);
        }

        // BIBD-style greedy schedule for N>2.
        //   R = ceil(2*(v-1)/(N-1)) matches per player per bracket; matchesPerBracket = R*v/N.
        //   Greedy: pick the N-subset that minimizes the max new pair co-occurrence count.
        //   Multi-seed retry (up to 16) keeps the schedule with the lowest imbalance; published
        //   guarantee is ±2 for all legal (v,N) with v≤32.
        //   Two brackets: bracket 2 uses cyclic slot rotation so no player permanently occupies
        //   the same positional slot (positional slot has no gameplay meaning for N>2).
        //   One Round row per match (RoundNumber=1, all nullable fields null).
        private void CreateFfaSchedule(League league, int n, Random rng)
        {
            const int MaxSeeds = 16;
            var members = league.Members.ToList();
            int v = members.Count;
            int R = (int)Math.Ceiling(2.0 * (v - 1) / (n - 1));
            int matchesPerBracket = R * v / n;

            List<List<string>>? bestGroups = null;
            int bestImbalance = int.MaxValue;

            for (int seed = 0; seed < MaxSeeds; seed++)
            {
                var seededRng = new Random(unchecked(rng.Next() ^ (int)(seed * 0x9e3779b9)));
                var (groups, imbalance) = TryGenerateFfaGroups(members, n, R, matchesPerBracket, seededRng);

                if (imbalance < bestImbalance)
                {
                    bestImbalance = imbalance;
                    bestGroups = groups;
                }
                if (bestImbalance <= 2) break;
            }

            var finalGroups = bestGroups!;

            var bracket1 = BuildBracketMatches(league, finalGroups, n, bracketNumber: 1, rotate: false);
            var bracket2 = BuildBracketMatches(league, finalGroups, n, bracketNumber: 2, rotate: true);

            Shuffle(bracket1, rng);
            Shuffle(bracket2, rng);

            for (int i = 0; i < bracket1.Count; i++) bracket1[i].MatchNumber = i + 1;
            for (int i = 0; i < bracket2.Count; i++) bracket2[i].MatchNumber = i + 1;

            foreach (var match in bracket1.Concat(bracket2))
            {
                context.Rounds.Add(new Round
                {
                    CompetitionId = match.CompetitionId,
                    MatchNumber = match.MatchNumber,
                    BracketNumber = match.BracketNumber,
                    RoundNumber = 1
                });
            }

            context.Matches.AddRange(bracket1);
            context.Matches.AddRange(bracket2);
        }

        private static (List<List<string>> Groups, int MaxImbalance) TryGenerateFfaGroups(
            List<CompetitionMember> members, int n, int R, int matchesPerBracket, Random rng)
        {
            var userIds = members.Select(m => m.UserId!).ToList();
            var pairCounts = new Dictionary<(string, string), int>();
            var playerLoad = userIds.ToDictionary(uid => uid, _ => 0);

            var groups = new List<List<string>>(matchesPerBracket);

            for (int matchIdx = 0; matchIdx < matchesPerBracket; matchIdx++)
            {
                var available = userIds
                    .Where(uid => playerLoad[uid] < R)
                    .OrderBy(_ => rng.Next())
                    .ToList();

                var bestGroup = PickBestGroup(available, pairCounts, n);
                groups.Add(bestGroup);

                for (int i = 0; i < bestGroup.Count; i++)
                {
                    playerLoad[bestGroup[i]]++;
                    for (int j = i + 1; j < bestGroup.Count; j++)
                    {
                        var key = PairKey(bestGroup[i], bestGroup[j]);
                        pairCounts[key] = pairCounts.GetValueOrDefault(key, 0) + 1;
                    }
                }
            }

            int imbalance = pairCounts.Count > 0
                ? pairCounts.Values.Max() - pairCounts.Values.Min()
                : 0;

            return (groups, imbalance);
        }

        private static List<string> PickBestGroup(
            List<string> available, Dictionary<(string, string), int> pairCounts, int n)
        {
            if (available.Count <= n) return available.Take(n).ToList();

            List<string>? bestGroup = null;
            int bestMaxPair = int.MaxValue;

            foreach (var combo in Combinations(available, n))
            {
                int maxPair = 0;
                for (int i = 0; i < combo.Count; i++)
                {
                    for (int j = i + 1; j < combo.Count; j++)
                    {
                        var key = PairKey(combo[i], combo[j]);
                        int cnt = pairCounts.GetValueOrDefault(key, 0) + 1;
                        if (cnt > maxPair) maxPair = cnt;
                    }
                }

                if (maxPair < bestMaxPair)
                {
                    bestMaxPair = maxPair;
                    bestGroup = combo;
                }
            }

            return bestGroup ?? available.Take(n).ToList();
        }

        private static IEnumerable<List<string>> Combinations(List<string> list, int k)
        {
            int n = list.Count;
            int[] indices = Enumerable.Range(0, k).ToArray();

            while (true)
            {
                yield return indices.Select(i => list[i]).ToList();

                int i2 = k - 1;
                while (i2 >= 0 && indices[i2] == i2 + n - k) i2--;
                if (i2 < 0) yield break;

                indices[i2]++;
                for (int j = i2 + 1; j < k; j++) indices[j] = indices[j - 1] + 1;
            }
        }

        private static (string, string) PairKey(string a, string b) =>
            string.Compare(a, b, StringComparison.Ordinal) < 0 ? (a, b) : (b, a);

        private static List<Match> BuildBracketMatches(League league, List<List<string>> groups, int n, int bracketNumber, bool rotate)
        {
            var matches = new List<Match>(groups.Count);
            foreach (var group in groups)
            {
                var slotted = rotate ? RotateCyclic(group) : group;
                matches.Add(new Match
                {
                    CompetitionId = league.Id,
                    BracketNumber = bracketNumber,
                    PlayerCount = n,
                    PlayerOneUserId = slotted.Count > 0 ? slotted[0] : null,
                    PlayerTwoUserId = slotted.Count > 1 ? slotted[1] : null,
                    PlayerThreeUserId = slotted.Count > 2 ? slotted[2] : null,
                    PlayerFourUserId = slotted.Count > 3 ? slotted[3] : null,
                });
            }
            return matches;
        }

        // [A, B, C, D] → [D, A, B, C]
        private static List<string> RotateCyclic(List<string> group)
        {
            if (group.Count <= 1) return group;
            var result = new List<string>(group.Count) { group[^1] };
            result.AddRange(group.Take(group.Count - 1));
            return result;
        }

        private static List<int> ComputeLegalVs(int n, int maxV)
        {
            var result = new List<int>();
            for (int v = n; v <= maxV; v++)
            {
                int r = (int)Math.Ceiling(2.0 * (v - 1) / (n - 1));
                if ((r * v) % n == 0)
                    result.Add(v);
            }
            return result;
        }

        private static void Shuffle<T>(IList<T> list, Random rng)
        {
            int count = list.Count;
            while (count > 1)
            {
                int k = rng.Next(count--);
                (list[count], list[k]) = (list[k], list[count]);
            }
        }
    }
}
