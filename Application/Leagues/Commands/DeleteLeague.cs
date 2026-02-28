using Application.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Leagues.Commands;

public class DeleteLeague
{
    public class Command : IRequest<Result<Unit>>
    {
        public required string LeagueId { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            var league = await context.Leagues
                .FirstOrDefaultAsync(x => x.Id == request.LeagueId, cancellationToken);

            if (league == null) return Result<Unit>.Failure("League not found", 404);

            // Delete in FK-safe order (all FKs use OnDelete: NoAction)
            context.RemoveRange(context.Rounds.Where(r => r.LeagueId == league.Id));
            context.RemoveRange(context.Matches.Where(m => m.LeagueId == league.Id));
            context.RemoveRange(context.LeagueMembers.Where(lm => lm.LeagueId == league.Id));
            context.Leagues.Remove(league);

            var res = await context.SaveChangesAsync(cancellationToken) > 0;

            if (!res) return Result<Unit>.Failure("Could not delete league", 400);
            return Result<Unit>.Success(Unit.Value);
        }
    }
}
