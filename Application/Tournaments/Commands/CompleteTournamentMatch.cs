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
            // Defensive check: no character reuse per player within the same match
            var playerOneUsed = new Dictionary<string, int>();
            var playerTwoUsed = new Dictionary<string, int>();
            foreach (var round in request.Rounds.Where(r => !string.IsNullOrEmpty(r.WinnerUserId)).OrderBy(r => r.RoundNumber))
            {
                if (!string.IsNullOrEmpty(round.PlayerOneCharacterId))
                {
                    if (playerOneUsed.TryGetValue(round.PlayerOneCharacterId, out var p1Prev))
                        return Result<Unit>.Failure($"Player 1 cannot reuse character (Round {p1Prev})", 400);
                    playerOneUsed[round.PlayerOneCharacterId] = round.RoundNumber;
                }
                if (!string.IsNullOrEmpty(round.PlayerTwoCharacterId))
                {
                    if (playerTwoUsed.TryGetValue(round.PlayerTwoCharacterId, out var p2Prev))
                        return Result<Unit>.Failure($"Player 2 cannot reuse character (Round {p2Prev})", 400);
                    playerTwoUsed[round.PlayerTwoCharacterId] = round.RoundNumber;
                }
            }

            var tournament = await context.Tournaments
                .FirstOrDefaultAsync(t => t.Id == request.TournamentId, cancellationToken);
            if (tournament == null) return Result<Unit>.Failure("Tournament not found", 404);

            var match = await context.Matches
                .Include(m => m.Rounds)
                .FirstOrDefaultAsync(m => m.CompetitionId == request.TournamentId && m.MatchNumber == request.MatchNumber, cancellationToken);
            if (match == null) return Result<Unit>.Failure("Match not found", 404);
            if (match.Completed) return Result<Unit>.Failure("Match is already completed", 400);
            if (match.PlayerOneUserId == null || match.PlayerTwoUserId == null)
                return Result<Unit>.Failure("Match does not have both players assigned yet", 400);

            // Update rounds with winners
            foreach (var round in request.Rounds.Where(r => !string.IsNullOrEmpty(r.WinnerUserId)))
            {
                var dbRound = await context.Rounds.FirstAsync(r =>
                    r.CompetitionId == request.TournamentId
                    && r.MatchNumber == request.MatchNumber
                    && r.RoundNumber == round.RoundNumber,
                    cancellationToken);

                round.Completed = true;
                mapper.Map(round, dbRound);
            }

            // Clear unplayed rounds
            foreach (var round in request.Rounds.Where(r => string.IsNullOrEmpty(r.WinnerUserId)))
            {
                var dbRound = await context.Rounds.FirstOrDefaultAsync(r =>
                    r.CompetitionId == request.TournamentId
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
            if (match.BracketNumber == totalRounds)
            {
                tournament.WinnerUserId = matchWinnerUserId;
                tournament.Status = CompetitionStatus.Complete;
                tournament.EndDate = DateTime.UtcNow;
            }

            var res = await context.SaveChangesAsync(cancellationToken) > 0;
            return res
                ? Result<Unit>.Success(Unit.Value)
                : Result<Unit>.Failure("Match could not be completed", 400);
        }

        private void AdvanceWinner(Tournament tournament, Match completedMatch, string winnerUserId)
        {
            var totalRounds = (int)Math.Log2(tournament.PlayerCount);
            if (completedMatch.BracketNumber >= totalRounds) return; // Final match, no next round

            // Calculate position within this bracket round
            var matchesInThisRound = context.Matches
                .Where(m => m.CompetitionId == tournament.Id && m.BracketNumber == completedMatch.BracketNumber)
                .OrderBy(m => m.MatchNumber)
                .ToList();
            var positionInRound = matchesInThisRound.FindIndex(m => m.MatchNumber == completedMatch.MatchNumber) + 1;

            int nextBracketNumber = completedMatch.BracketNumber + 1;
            var nextRoundMatches = context.Matches
                .Where(m => m.CompetitionId == tournament.Id && m.BracketNumber == nextBracketNumber)
                .OrderBy(m => m.MatchNumber)
                .ToList();

            int nextMatchIndex = (positionInRound - 1) / 2;
            if (nextMatchIndex >= nextRoundMatches.Count) return;

            var nextMatch = nextRoundMatches[nextMatchIndex];

            // Odd positions feed into PlayerOne, even into PlayerTwo
            if (positionInRound % 2 == 1)
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
