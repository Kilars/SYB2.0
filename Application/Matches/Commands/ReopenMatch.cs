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
        public required string CompetitionId { get; set; }
        public required int BracketNumber { get; set; }
        public required int MatchNumber { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            var match = await context.Matches
                .Include(x => x.Rounds)
                .FirstAsync(m => m.CompetitionId == request.CompetitionId && m.BracketNumber == request.BracketNumber && m.MatchNumber == request.MatchNumber,
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
