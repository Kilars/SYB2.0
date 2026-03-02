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

            // Check if winner has advanced and next match has been played
            var totalRounds = (int)Math.Log2(tournament.PlayerCount);
            if (match.BracketNumber < totalRounds)
            {
                // Find position within bracket round
                var matchesInThisRound = await context.Matches
                    .Where(m => m.CompetitionId == tournament.Id && m.BracketNumber == match.BracketNumber)
                    .OrderBy(m => m.MatchNumber)
                    .ToListAsync(cancellationToken);
                var positionInRound = matchesInThisRound.FindIndex(m => m.MatchNumber == match.MatchNumber) + 1;

                int nextBracketNumber = match.BracketNumber + 1;
                var nextRoundMatches = await context.Matches
                    .Where(m => m.CompetitionId == tournament.Id && m.BracketNumber == nextBracketNumber)
                    .OrderBy(m => m.MatchNumber)
                    .ToListAsync(cancellationToken);

                int nextMatchIndex = (positionInRound - 1) / 2;
                var nextMatch = nextMatchIndex < nextRoundMatches.Count ? nextRoundMatches[nextMatchIndex] : null;

                if (nextMatch?.Completed == true)
                    return Result<Unit>.Failure("Cannot reopen — the next bracket match has already been completed", 400);

                // Remove winner from next match
                if (nextMatch != null)
                {
                    if (positionInRound % 2 == 1)
                        nextMatch.PlayerOneUserId = null;
                    else
                        nextMatch.PlayerTwoUserId = null;
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

            // Reset all rounds
            foreach (var round in match.Rounds)
            {
                round.Completed = false;
                round.WinnerUserId = null;
                round.PlayerOneCharacterId = null;
                round.PlayerTwoCharacterId = null;
            }

            var res = await context.SaveChangesAsync(cancellationToken) > 0;
            return res
                ? Result<Unit>.Success(Unit.Value)
                : Result<Unit>.Failure("Could not reopen match", 400);
        }
    }
}
