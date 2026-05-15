using System;
using Application.Core;
using Application.Matches.DTOs;
using AutoMapper;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Tournaments.Commands;

public class CompleteTournamentMatch
{
    public class Command : IRequest<Result<Unit>>
    {
        public required string TournamentId { get; set; }
        public required int MatchNumber { get; set; }
        public required List<RoundDto> Rounds { get; set; }
    }

    public class Handler(AppDbContext context, IMapper mapper) : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            var tournament = await context.Tournaments
                .FirstOrDefaultAsync(t => t.Id == request.TournamentId, cancellationToken);
            if (tournament == null) return Result<Unit>.Failure("Tournament not found", 404);

            var match = await context.Matches
                .Include(m => m.Rounds)
                .FirstOrDefaultAsync(m => m.CompetitionId == request.TournamentId && m.MatchNumber == request.MatchNumber, cancellationToken);
            if (match == null) return Result<Unit>.Failure("Match not found", 404);
            if (match.Completed) return Result<Unit>.Failure("Match is already completed", 400);

            int perHeatN = match.PlayerCount;

            if (perHeatN == 2)
            {
                // N=2 Bo3: existing multi-round logic
                if (match.PlayerOneUserId == null || match.PlayerTwoUserId == null)
                    return Result<Unit>.Failure("Match does not have both players assigned yet", 400);

                // Update rounds with winners
                foreach (var round in request.Rounds.Where(r => !string.IsNullOrEmpty(r.WinnerUserId)))
                {
                    var dbRound = match.Rounds.First(r => r.RoundNumber == round.RoundNumber);
                    round.Completed = true;
                    mapper.Map(round, dbRound);
                }

                // Clear unplayed rounds
                foreach (var round in request.Rounds.Where(r => string.IsNullOrEmpty(r.WinnerUserId)))
                {
                    var dbRound = match.Rounds.FirstOrDefault(r => r.RoundNumber == round.RoundNumber);
                    if (dbRound != null)
                    {
                        dbRound.WinnerUserId = null;
                        dbRound.PlayerOneCharacterId = null;
                        dbRound.PlayerTwoCharacterId = null;
                        dbRound.Completed = false;
                    }
                }

                // Determine match winner (majority of rounds)
                var matchWinnerUserId = request.Rounds
                    .Where(r => !string.IsNullOrEmpty(r.WinnerUserId))
                    .GroupBy(r => r.WinnerUserId)
                    .OrderByDescending(group => group.Count())
                    .Select(g => g.Key)
                    .First();

                match.RegisteredTime ??= DateTime.UtcNow;
                match.Completed = true;
                match.WinnerUserId = matchWinnerUserId;

                // Advance winner to next round (1 advancer)
                await AdvanceAdvancers(tournament, match, [(matchWinnerUserId!, 1)], cancellationToken);
            }
            else
            {
                // N>2 single-round: placement data lives on Rounds[0]
                if (request.Rounds.Count == 0)
                    return Result<Unit>.Failure("No rounds provided", 400);

                var firstRound = request.Rounds[0];
                var winnerUserId = firstRound.WinnerUserId;
                if (string.IsNullOrEmpty(winnerUserId))
                    return Result<Unit>.Failure("Winner is required", 400);

                var participantIds = new HashSet<string?>
                {
                    match.PlayerOneUserId,
                    match.PlayerTwoUserId,
                    match.PlayerThreeUserId,
                    match.PlayerFourUserId
                };
                participantIds.RemoveWhere(p => p == null);

                if (!participantIds.Contains(winnerUserId))
                    return Result<Unit>.Failure("Winner is not a participant in this match", 400);

                // Update the single round row
                var dbRound = match.Rounds.FirstOrDefault(r => r.RoundNumber == 1);
                if (dbRound != null)
                {
                    dbRound.WinnerUserId = winnerUserId;
                    dbRound.Completed = true;
                    dbRound.PlayerOneCharacterId = firstRound.PlayerOneCharacterId;
                    dbRound.PlayerTwoCharacterId = firstRound.PlayerTwoCharacterId;
                    dbRound.PlayerThreeCharacterId = firstRound.PlayerThreeCharacterId;
                    dbRound.PlayerFourCharacterId = firstRound.PlayerFourCharacterId;
                }

                match.RegisteredTime ??= DateTime.UtcNow;
                match.Completed = true;

                match.WinnerUserId = winnerUserId;
                match.SecondPlaceUserId = firstRound.SecondPlaceUserId;
                match.ThirdPlaceUserId = firstRound.ThirdPlaceUserId;
                match.FourthPlaceUserId = firstRound.FourthPlaceUserId;

                // Build advancer list
                var advancers = new List<(string userId, int placement)>
                {
                    (winnerUserId, 1)
                };
                if (perHeatN == 4 && !string.IsNullOrEmpty(firstRound.SecondPlaceUserId))
                    advancers.Add((firstRound.SecondPlaceUserId!, 2));

                await AdvanceAdvancers(tournament, match, advancers, cancellationToken);
            }

            // Final-round detection using integer-safe BracketSizing
            var totalRounds = BracketSizing.TotalRoundsFor(perHeatN, tournament.BracketSize);
            if (match.BracketNumber == totalRounds)
            {
                tournament.WinnerUserId = match.WinnerUserId;
                tournament.Status = CompetitionStatus.Complete;
                tournament.EndDate = DateTime.UtcNow;
            }

            var res = await context.SaveChangesAsync(cancellationToken) > 0;
            return res
                ? Result<Unit>.Success(Unit.Value)
                : Result<Unit>.Failure("Match could not be completed", 400);
        }

        /// <summary>
        /// Fills the next-round match slots for the given advancers using <see cref="SlotMapping"/>.
        ///
        /// <para>Early-return when no next round exists: if the completed match is in the final
        /// bracket round, there is nothing to advance into.</para>
        /// </summary>
        private async Task AdvanceAdvancers(Tournament tournament, Match completedMatch, List<(string userId, int placement)> advancers, CancellationToken cancellationToken)
        {
            int perHeatN = completedMatch.PlayerCount;
            var totalRounds = BracketSizing.TotalRoundsFor(perHeatN, tournament.BracketSize);

            // Early-return: final round — no next match to fill.
            if (completedMatch.BracketNumber >= totalRounds) return;

            // positionInRound is 0-based: index of this match in BracketNumber-ordered match list.
            var matchesInThisRound = await context.Matches
                .Where(m => m.CompetitionId == tournament.Id && m.BracketNumber == completedMatch.BracketNumber)
                .OrderBy(m => m.MatchNumber)
                .ToListAsync(cancellationToken);
            var positionInRound = matchesInThisRound.FindIndex(m => m.MatchNumber == completedMatch.MatchNumber);

            var (nextMatchIndex, slotIndices) = SlotMapping.For(positionInRound, perHeatN);

            int nextBracketNumber = completedMatch.BracketNumber + 1;
            var nextRoundMatches = await context.Matches
                .Where(m => m.CompetitionId == tournament.Id && m.BracketNumber == nextBracketNumber)
                .OrderBy(m => m.MatchNumber)
                .ToListAsync(cancellationToken);

            if (nextMatchIndex >= nextRoundMatches.Count) return;
            var nextMatch = nextRoundMatches[nextMatchIndex];

            for (int i = 0; i < advancers.Count && i < slotIndices.Length; i++)
            {
                SlotMapping.SetSlot(nextMatch, slotIndices[i], advancers[i].userId);
            }
        }
    }
}
