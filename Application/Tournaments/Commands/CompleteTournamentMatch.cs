using System;
using Application.Core;
using Application.Tournaments.DTOs;
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
        public required List<TournamentRoundDto> Rounds { get; set; }
    }

    public class Handler(AppDbContext context, IMapper mapper) : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            var tournament = await context.Tournaments
                .FirstOrDefaultAsync(t => t.Id == request.TournamentId, cancellationToken);
            if (tournament == null) return Result<Unit>.Failure("Tournament not found", 404);

            var match = await context.TournamentMatches
                .Include(m => m.Rounds)
                .FirstOrDefaultAsync(m => m.TournamentId == request.TournamentId && m.MatchNumber == request.MatchNumber, cancellationToken);
            if (match == null) return Result<Unit>.Failure("Match not found", 404);
            if (match.Completed) return Result<Unit>.Failure("Match is already completed", 400);
            if (match.PlayerOneUserId == null || match.PlayerTwoUserId == null)
                return Result<Unit>.Failure("Match does not have both players assigned yet", 400);

            // Update rounds with winners
            foreach (var round in request.Rounds.Where(r => !string.IsNullOrEmpty(r.WinnerUserId)))
            {
                var dbRound = await context.TournamentRounds.FirstAsync(r =>
                    r.TournamentId == request.TournamentId
                    && r.MatchNumber == request.MatchNumber
                    && r.RoundNumber == round.RoundNumber,
                    cancellationToken);

                round.Completed = true;
                mapper.Map(round, dbRound);
            }

            // Clear unplayed rounds
            foreach (var round in request.Rounds.Where(r => string.IsNullOrEmpty(r.WinnerUserId)))
            {
                var dbRound = await context.TournamentRounds.FirstOrDefaultAsync(r =>
                    r.TournamentId == request.TournamentId
                    && r.MatchNumber == request.MatchNumber
                    && r.RoundNumber == round.RoundNumber,
                    cancellationToken);

                if (dbRound != null)
                {
                    dbRound.WinnerUserId = null;
                    dbRound.PlayerOneCharacterId = null;
                    dbRound.PlayerTwoCharacterId = null;
                    dbRound.Completed = false;
                }
            }

            // Determine match winner
            var matchWinnerUserId = request.Rounds
                .Where(r => !string.IsNullOrEmpty(r.WinnerUserId))
                .GroupBy(r => r.WinnerUserId)
                .OrderByDescending(group => group.Count())
                .Select(g => g.Key)
                .First();

            match.RegisteredTime ??= DateTime.UtcNow;
            match.Completed = true;
            match.WinnerUserId = matchWinnerUserId;

            // Advance winner to next round
            AdvanceWinner(tournament, match, matchWinnerUserId!);

            // Check if tournament is complete (final match completed)
            var totalRounds = (int)Math.Log2(tournament.PlayerCount);
            if (match.BracketRound == totalRounds)
            {
                tournament.WinnerUserId = matchWinnerUserId;
                tournament.Status = TournamentStatus.Complete;
                tournament.EndDate = DateTime.UtcNow;
            }

            var res = await context.SaveChangesAsync(cancellationToken) > 0;
            return res
                ? Result<Unit>.Success(Unit.Value)
                : Result<Unit>.Failure("Match could not be completed", 400);
        }

        private void AdvanceWinner(Tournament tournament, TournamentMatch completedMatch, string winnerUserId)
        {
            var totalRounds = (int)Math.Log2(tournament.PlayerCount);
            if (completedMatch.BracketRound >= totalRounds) return; // Final match, no next round

            int nextRound = completedMatch.BracketRound + 1;
            int nextPosition = (completedMatch.BracketPosition + 1) / 2; // ceil(pos/2)

            var nextMatch = context.TournamentMatches
                .FirstOrDefault(m =>
                    m.TournamentId == tournament.Id
                    && m.BracketRound == nextRound
                    && m.BracketPosition == nextPosition);

            if (nextMatch == null) return;

            // Odd bracket positions feed into PlayerOne, even into PlayerTwo
            if (completedMatch.BracketPosition % 2 == 1)
            {
                nextMatch.PlayerOneUserId = winnerUserId;
            }
            else
            {
                nextMatch.PlayerTwoUserId = winnerUserId;
            }
        }
    }
}
