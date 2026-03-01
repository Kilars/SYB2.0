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

            var validCounts = new[] { 4, 8, 16, 32 };
            if (!validCounts.Contains(tournament.Members.Count))
                return Result<string>.Failure($"Tournament must have exactly 4, 8, 16, or 32 players. Got {tournament.Members.Count}.", 400);

            var validBestOf = new[] { 1, 3, 5 };
            if (!validBestOf.Contains(request.TournamentDto.BestOf))
                return Result<string>.Failure("BestOf must be 1, 3, or 5.", 400);

            tournament.PlayerCount = tournament.Members.Count;
            tournament.BestOf = request.TournamentDto.BestOf;

            if (tournament.Members.Any(m => m.UserId == user.Id))
            {
                tournament.Members.First(m => m.UserId == user.Id).IsAdmin = true;
            }
            else
            {
                tournament.Members.Add(new TournamentMember
                {
                    UserId = user.Id,
                    IsAdmin = true
                });
                tournament.PlayerCount = tournament.Members.Count;
                if (!validCounts.Contains(tournament.PlayerCount))
                    return Result<string>.Failure($"Tournament must have exactly 4, 8, 16, or 32 players (including you). Got {tournament.PlayerCount}.", 400);
            }

            context.Tournaments.Add(tournament);

            var res = await context.SaveChangesAsync(cancellationToken) > 0;

            return res
                ? Result<string>.Success(tournament.Id)
                : Result<string>.Failure("Failed to create tournament", 400);
        }
    }
}
