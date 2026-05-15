using System;
using Application.Core;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Tournaments.Commands;

public class ReopenTournamentMatch
{
    public class Command : IRequest<Result<Unit>>
    {
        public required string TournamentId { get; set; }
        public required int MatchNumber { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            var tournament = await context.Tournaments
                .FirstOrDefaultAsync(t => t.Id == request.TournamentId, cancellationToken);
            if (tournament == null) return Result<Unit>.Failure("Tournament not found", 404);

            var match = await context.Matches
                .Include(m => m.Rounds)
                .FirstOrDefaultAsync(m =>
                    m.CompetitionId == request.TournamentId && m.MatchNumber == request.MatchNumber, cancellationToken);
            if (match == null) return Result<Unit>.Failure("Match not found", 404);
            if (!match.Completed) return Result<Unit>.Failure("Match is not completed", 400);

            int perHeatN = match.PlayerCount;
            var totalRounds = BracketSizing.TotalRoundsFor(perHeatN, tournament.BracketSize);

            // If this is not the final round, clear the advancers from the next-round match
            // using SlotMapping — the same mapping used by AdvanceAdvancers in CompleteTournamentMatch,
            // so the exact slots that were filled are the ones cleared here.
            //
            // Transitive safety: we only need to block completion of the immediate next match.
            // A next-next match cannot be completed unless the next match is Complete first,
            // so blocking one level is sufficient to protect the entire downstream subtree.
            if (match.BracketNumber < totalRounds)
            {
                var matchesInThisRound = await context.Matches
                    .Where(m => m.CompetitionId == tournament.Id && m.BracketNumber == match.BracketNumber)
                    .OrderBy(m => m.MatchNumber)
                    .ToListAsync(cancellationToken);
                var positionInRound = matchesInThisRound.FindIndex(m => m.MatchNumber == match.MatchNumber);

                int nextBracketNumber = match.BracketNumber + 1;
                var nextRoundMatches = await context.Matches
                    .Where(m => m.CompetitionId == tournament.Id && m.BracketNumber == nextBracketNumber)
                    .OrderBy(m => m.MatchNumber)
                    .ToListAsync(cancellationToken);

                var (nextMatchIndex, slotIndices) = SlotMapping.For(positionInRound, perHeatN);

                var nextMatch = nextMatchIndex < nextRoundMatches.Count ? nextRoundMatches[nextMatchIndex] : null;

                if (nextMatch?.Completed == true)
                    return Result<Unit>.Failure("Cannot reopen — the next bracket match has already been completed", 400);

                if (nextMatch != null)
                {
                    foreach (var slotIndex in slotIndices)
                        SlotMapping.SetSlot(nextMatch, slotIndex, null);
                }
            }

            // Reset tournament completion if this was the final
            if (match.BracketNumber == totalRounds)
            {
                tournament.WinnerUserId = null;
                tournament.Status = CompetitionStatus.Active;
                tournament.EndDate = null;
            }

            match.Completed = false;
            match.WinnerUserId = null;
            match.SecondPlaceUserId = null;
            match.ThirdPlaceUserId = null;
            match.FourthPlaceUserId = null;

            if (perHeatN == 2)
            {
                // N=2 Bo3: reset all per-round data
                foreach (var round in match.Rounds)
                {
                    round.Completed = false;
                    round.WinnerUserId = null;
                    round.PlayerOneCharacterId = null;
                    round.PlayerTwoCharacterId = null;
                }
            }
            else
            {
                // N>2 single-round: reset the one round row
                var singleRound = match.Rounds.FirstOrDefault(r => r.RoundNumber == 1);
                if (singleRound != null)
                {
                    singleRound.Completed = false;
                    singleRound.WinnerUserId = null;
                    singleRound.PlayerOneCharacterId = null;
                    singleRound.PlayerTwoCharacterId = null;
                    singleRound.PlayerThreeCharacterId = null;
                    singleRound.PlayerFourCharacterId = null;
                }
            }

            var res = await context.SaveChangesAsync(cancellationToken) > 0;
            return res
                ? Result<Unit>.Success(Unit.Value)
                : Result<Unit>.Failure("Could not reopen match", 400);
        }
    }
}
