using System;
using Application.Core;
using Application.Tournaments;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Tournaments.Commands;

public class ShuffleBracket
{
    public class Command : IRequest<Result<Unit>>
    {
        public required string TournamentId { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            var tournament = await context.Tournaments
                .Include(x => x.Members)
                .Include(x => x.Matches)
                    .ThenInclude(m => m.Rounds)
                .FirstOrDefaultAsync(x => x.Id == request.TournamentId, cancellationToken);

            if (tournament == null)
                return Result<Unit>.Failure("Tournament not found", 404);

            if (tournament.Status != CompetitionStatus.Active)
                return Result<Unit>.Failure("Can only shuffle bracket of active tournaments", 400);

            // Check if any match has been completed
            if (tournament.Matches.Any(m => m.Completed))
                return Result<Unit>.Failure("Cannot shuffle bracket after matches have been completed", 400);

            // Remove existing matches and rounds first (separate save to avoid key collisions
            // when BuildBracket re-inserts rows with the same composite keys).
            context.RemoveRange(context.Rounds.Where(r => r.CompetitionId == tournament.Id));
            context.RemoveRange(context.Matches.Where(m => m.CompetitionId == tournament.Id));
            await context.SaveChangesAsync(cancellationToken);

            // Regenerate bracket with new seeding. Per-heat N is read from the persisted
            // Tournament.PerHeatPlayerCount (not from the just-deleted Match rows).
            BracketBuilder.BuildBracket(context, tournament, tournament.Members.ToList(), tournament.PerHeatPlayerCount);

            var res = await context.SaveChangesAsync(cancellationToken) > 0;
            return res
                ? Result<Unit>.Success(Unit.Value)
                : Result<Unit>.Failure("Could not shuffle bracket", 400);
        }
    }
}
