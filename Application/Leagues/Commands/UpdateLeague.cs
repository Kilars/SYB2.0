using System;
using Application.Leagues.DTOs;
using AutoMapper;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Leagues.Commands;

public class UpdateLeague
{
    public class Command : IRequest<Unit>
    {
        public required UpdateLeagueDto UpdateLeagueDto { get; set; }
    }

    public class Handler(AppDbContext context, IMapper mapper) : IRequestHandler<Command, Unit>
    {
        public async Task<Unit> Handle(Command request, CancellationToken cancellationToken)
        {
            var league = await context.Leagues
                .Include(x => x.Members)
                .FirstOrDefaultAsync(x => x.Id == request.UpdateLeagueDto.Id, cancellationToken: cancellationToken);

            if (league == null) throw new Exception("Cannot find league");

            league.Title = request.UpdateLeagueDto.Title;
            league.StartDate = request.UpdateLeagueDto.StartDate;
            league.Description = request.UpdateLeagueDto.Description;

            var updatedUserIds = request.UpdateLeagueDto.Members.Select(m => m.UserId).ToHashSet();

            var existingMembersToKeep = league.Members
                .Where(m => !updatedUserIds.Contains(m.UserId!));

            var newMembersToAdd = request.UpdateLeagueDto.Members
                .Where(m => m.Id == null)
                .Select(mapper.Map<LeagueMember>);

            league.Members.Clear();
            league.Members = [.. existingMembersToKeep, .. newMembersToAdd];

            var res = await context.SaveChangesAsync(cancellationToken) > 0;

            if (!res) throw new Exception("Failed to update leaderboard");

            return Unit.Value;
        }
    }
}
