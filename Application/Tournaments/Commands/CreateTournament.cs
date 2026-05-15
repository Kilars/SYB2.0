using System;
using Application.Core;
using Application.Interfaces;
using Application.Tournaments.DTOs;
using AutoMapper;
using Domain;
using MediatR;
using Persistence;

namespace Application.Tournaments.Commands;

public class CreateTournament
{
    public class Command : IRequest<Result<string>>
    {
        public required CreateTournamentDto TournamentDto { get; set; }
    }

    public class Handler(AppDbContext context, IMapper mapper, IUserAccessor userAccessor) : IRequestHandler<Command, Result<string>>
    {
        public async Task<Result<string>> Handle(Command request, CancellationToken cancellationToken)
        {
            var user = await userAccessor.GetUserAsync();
            var tournament = mapper.Map<Tournament>(request.TournamentDto);

            var validBestOf = new[] { 1, 3, 5 };
            if (!validBestOf.Contains(request.TournamentDto.BestOf))
                return Result<string>.Failure("BestOf must be 1, 3, or 5.", 400);

            tournament.BestOf = request.TournamentDto.BestOf;
            tournament.PerHeatPlayerCount = request.TournamentDto.PerHeatPlayerCount;

            // Initialize BracketSize to the minimum legal size for this N (= PerHeatPlayerCount,
            // which is always present in ValidBracketSizesFor(N) because every set starts with N).
            // This avoids log2(0)-style pathologies in any Planned-status read path. The final
            // BracketSize is locked at StartTournament once the exact roster is invited.
            tournament.BracketSize = tournament.PerHeatPlayerCount;

            if (tournament.Members.Any(m => m.UserId == user.Id))
            {
                tournament.Members.First(m => m.UserId == user.Id).IsAdmin = true;
            }
            else
            {
                tournament.Members.Add(new CompetitionMember
                {
                    UserId = user.Id,
                    IsAdmin = true
                });
            }

            context.Tournaments.Add(tournament);

            var res = await context.SaveChangesAsync(cancellationToken) > 0;

            return res
                ? Result<string>.Success(tournament.Id)
                : Result<string>.Failure("Failed to create tournament", 400);
        }
    }
}
