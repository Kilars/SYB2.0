using System;
using System.Text.RegularExpressions;
using Application.Core;
using Application.Leagues.DTOs;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Matches.Commands;

public class CompleteMatch
{
    public class Command : IRequest<Result<Unit>>
    {
        public required string MatchId { get; set; }
        public required List<RoundDto> Rounds { get; set; }
    }

    public class Handler(AppDbContext context, IMapper mapper) : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            foreach (var round in request.Rounds.Where(r => !string.IsNullOrEmpty(r.WinnerUserId)))
            {
                var dbRound = await context.Rounds.FirstAsync(r =>
                    r.LeagueId == round.RoundId.LeagueId
                    && r.Split == round.RoundId.Split
                    && r.MatchIndex == round.RoundId.MatchIndex
                    && r.RoundNumber == round.RoundId.RoundNumber,
                    cancellationToken: cancellationToken);

                if (dbRound == null) return Result<Unit>.Failure($"Round ({round.RoundId.LeagueId}, {round.RoundId.Split}, {round.RoundId.MatchIndex}, {round.RoundId.RoundNumber}) does not exist", 400);

                round.Completed = true;
                mapper.Map(round, dbRound);
            }
            ;

            var matchWinnerUserId = request.Rounds.GroupBy(r => r.WinnerUserId).OrderByDescending(group => group.Count()).Select(g => g.Key).First();
            var compositeIdSplit = request.MatchId.Split('_');
            if (compositeIdSplit.Length != 3) return Result<Unit>.Failure("Match not found, invalid matchId", 404);
            var leagueId = compositeIdSplit[0];
            var split = compositeIdSplit[1];
            var matchIndex = compositeIdSplit[2];

            var match = await context.Matches.FirstAsync(m =>
                m.LeagueId == leagueId && m.Split.ToString() == split && m.MatchIndex.ToString() == matchIndex, cancellationToken: cancellationToken);

            if (match == null) return Result<Unit>.Failure("Match not found, invalid matchId", 404);

            match.RegisteredTime ??= DateTime.UtcNow;
            match.Completed = true;
            match.WinnerUserId = matchWinnerUserId;

            var res = await context.SaveChangesAsync(cancellationToken) > 0;

            return res ? Result<Unit>.Success(Unit.Value) : Result<Unit>.Failure("Match could not be completed", 400);
        }
    }

}
