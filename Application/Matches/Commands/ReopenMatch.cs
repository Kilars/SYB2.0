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
        public required string LeagueId { get; set; }
        public required int Split { get; set; }
        public required int MatchNumber { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            var match = await context.Matches
                .Include(x => x.Rounds)
                .FirstAsync(m => m.LeagueId == request.LeagueId && m.Split == request.Split && m.MatchNumber == request.MatchNumber,
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
