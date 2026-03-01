using Application.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Tournaments.Commands;

public class DeleteTournament
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
                .FirstOrDefaultAsync(x => x.Id == request.TournamentId, cancellationToken);

            if (tournament == null) return Result<Unit>.Failure("Tournament not found", 404);

            // Delete in FK-safe order (all FKs use OnDelete: NoAction)
            context.RemoveRange(context.TournamentRounds.Where(r => r.TournamentId == tournament.Id));
            context.RemoveRange(context.TournamentMatches.Where(m => m.TournamentId == tournament.Id));
            context.RemoveRange(context.TournamentMembers.Where(tm => tm.TournamentId == tournament.Id));
            context.Tournaments.Remove(tournament);

            var res = await context.SaveChangesAsync(cancellationToken) > 0;

            if (!res) return Result<Unit>.Failure("Could not delete tournament", 400);
            return Result<Unit>.Success(Unit.Value);
        }
    }
}
