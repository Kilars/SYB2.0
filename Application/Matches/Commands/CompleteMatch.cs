using System;
using Application.Core;
using Application.Matches.DTOs;
using AutoMapper;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Matches.Commands;

public class CompleteMatch
{
    public class Command : IRequest<Result<Unit>>
    {
        public required string CompetitionId { get; set; }
        public required int BracketNumber { get; set; }
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

            foreach (var round in request.Rounds.Where(r => !string.IsNullOrEmpty(r.WinnerUserId)))
            {
                var dbRound = await context.Rounds.FirstAsync(r =>
                   r.CompetitionId == round.CompetitionId
                    && r.BracketNumber == round.BracketNumber
                    && r.MatchNumber == round.MatchNumber
                    && r.RoundNumber == round.RoundNumber,
                    cancellationToken: cancellationToken);

                if (dbRound == null) return Result<Unit>.Failure($"Round ({round.CompetitionId}, {round.BracketNumber}, {round.MatchNumber}, {round.RoundNumber}) does not exist", 400);

                round.Completed = true;
                mapper.Map(round, dbRound);
            }

            // Clear rounds without a winner (e.g., round 3 in a 2-0 result after reopening a 2-1)
            foreach (var round in request.Rounds.Where(r => string.IsNullOrEmpty(r.WinnerUserId)))
            {
                var dbRound = await context.Rounds.FirstOrDefaultAsync(r =>
                   r.CompetitionId == request.CompetitionId
                    && r.BracketNumber == request.BracketNumber
                    && r.MatchNumber == request.MatchNumber
                    && r.RoundNumber == round.RoundNumber,
                    cancellationToken: cancellationToken);

                if (dbRound != null)
                {
                    dbRound.WinnerUserId = null;
                    dbRound.PlayerOneCharacterId = null;
                    dbRound.PlayerTwoCharacterId = null;
                    dbRound.Completed = false;
                }
            }

            var matchWinnerUserId = request.Rounds
                .Where(r => !string.IsNullOrEmpty(r.WinnerUserId))
                .GroupBy(r => r.WinnerUserId)
                .OrderByDescending(group => group.Count())
                .Select(g => g.Key)
                .First();

            var match = await context.Matches.FirstAsync(m =>
                m.CompetitionId == request.CompetitionId
                && m.BracketNumber == request.BracketNumber
                && m.MatchNumber == request.MatchNumber,
                cancellationToken: cancellationToken
            );

            if (match == null) return Result<Unit>.Failure("Match not found, invalid matchId", 404);

            match.RegisteredTime ??= DateTime.UtcNow;
            match.Completed = true;
            match.WinnerUserId = matchWinnerUserId;

            var res = await context.SaveChangesAsync(cancellationToken) > 0;

            return res ? Result<Unit>.Success(Unit.Value) : Result<Unit>.Failure("Match could not be completed", 400);
        }
    }

}
