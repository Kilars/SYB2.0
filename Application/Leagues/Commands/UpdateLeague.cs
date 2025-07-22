using System;
using Application.Core;
using Application.Leagues.DTOs;
using AutoMapper;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Leagues.Commands;

public class UpdateLeague
{
    public class Command : IRequest<Result<Unit>>
    {
        public required UpdateLeagueDto UpdateLeagueDto { get; set; }
    }

    public class Handler(AppDbContext context, IMapper mapper) : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            var league = await context.Leagues
                .Include(x => x.Members)
                .FirstOrDefaultAsync(x => x.Id == request.UpdateLeagueDto.Id, cancellationToken: cancellationToken);

            if (league == null) return Result<Unit>.Failure("Cannot find league", 404);

            league.Title = request.UpdateLeagueDto.Title;
            league.StartDate = request.UpdateLeagueDto.StartDate;
            league.Description = request.UpdateLeagueDto.Description;

            var updatedUserIds = request.UpdateLeagueDto.Members.Select(m => m.UserId).ToHashSet();

            var existingMembersToKeep = league.Members
                .Where(m => updatedUserIds.Contains(m.UserId!)).ToList();

            var newMembersToAdd = request.UpdateLeagueDto.Members
                .Where(m => m.Id == null)
                .Select(mapper.Map<LeagueMember>).ToList();

            var adminsRemoved = league.Members.Where(m => !updatedUserIds.Contains(m.UserId!)).Any(x => x.IsAdmin);
            if (adminsRemoved) return Result<Unit>.Failure("Cannot remove admin user", 403);

            league.Members.Clear();
            league.Members = [.. existingMembersToKeep, .. newMembersToAdd];

            var res = await context.SaveChangesAsync(cancellationToken) > 0;

            return res
             ? Result<Unit>.Success(Unit.Value)
             : Result<Unit>.Failure("Failed to update leaderboard", 400);
        }
    }
}
