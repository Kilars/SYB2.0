using System;
using Application.Core;
using Application.Tournaments;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Tournaments.Commands;

public class StartTournament
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
                .FirstOrDefaultAsync(x => x.Id == request.TournamentId, cancellationToken);

            if (tournament == null)
                return Result<Unit>.Failure("Tournament not found", 404);

            if (tournament.Status != CompetitionStatus.Planned)
                return Result<Unit>.Failure("Tournament must be in Planned status to start", 400);

            var perHeatPlayerCount = tournament.PerHeatPlayerCount;

            // Exact-size roster required: member count must equal a legal bracket size for
            // this per-heat N. No padding — short rosters are rejected, not filled.
            if (!BracketSizing.IsLegalRosterCount(perHeatPlayerCount, tournament.Members.Count))
            {
                var legal = string.Join(", ", BracketSizing.ValidBracketSizesFor(perHeatPlayerCount));
                return Result<Unit>.Failure(
                    $"N={perHeatPlayerCount}-player tournament requires exactly one of these member counts: {legal}. Currently {tournament.Members.Count} members invited.",
                    400);
            }

            tournament.BracketSize = tournament.Members.Count;

            // Defense-in-depth: re-validate BestOf vs per-heat N (validator enforces this at create).
            if (perHeatPlayerCount > 2 && tournament.BestOf != 1)
                return Result<Unit>.Failure("Best of must be 1 when per-heat player count is greater than 2", 400);

            BracketBuilder.BuildBracket(context, tournament, tournament.Members.ToList(), perHeatPlayerCount);
            tournament.Status = CompetitionStatus.Active;

            var res = await context.SaveChangesAsync(cancellationToken) > 0;
            return res
                ? Result<Unit>.Success(Unit.Value)
                : Result<Unit>.Failure("Could not start tournament", 400);
        }
    }
}
