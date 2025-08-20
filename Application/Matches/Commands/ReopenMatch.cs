using System;
using Application.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Matches.Commands;

public class ReopenMatch
{
    public class Command : IRequest<Result<Unit>>
    {
        public required string MatchId { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {

            var compositeIdSplit = request.MatchId.Split('_');
            if (compositeIdSplit.Length != 3) return Result<Unit>.Failure("Match not found, invalid matchId", 404);
            var leagueId = compositeIdSplit[0];
            var split = compositeIdSplit[1];
            var matchIndex = compositeIdSplit[2];

            var match = await context.Matches
                .Include(x => x.Rounds)
                .FirstAsync(m => m.LeagueId == leagueId && m.Split.ToString() == split && m.MatchIndex.ToString() == matchIndex,
                cancellationToken: cancellationToken);

            foreach (var round in match.Rounds)
            {
                round.Completed = false;
            }
            match.Completed = false;
            match.WinnerUserId = null;

            var res = await context.SaveChangesAsync(cancellationToken) > 0;

            return res ? Result<Unit>.Success(Unit.Value) : Result<Unit>.Failure("Match could not be reopened", 400);
        }
    }

}
