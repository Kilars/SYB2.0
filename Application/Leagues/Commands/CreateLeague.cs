using System;
using Application.Interfaces;
using Application.Leagues.DTOs;
using AutoMapper;
using Domain;
using MediatR;
using Persistence;

namespace Application.Leagues.Commands;

public class CreateLeague
{
    public class Command : IRequest<string>
    {
        public required CreateLeagueDto LeagueDto { get; set; }
    }

    public class Handler(AppDbContext context, IMapper mapper, IUserAccessor userAccessor) : IRequestHandler<Command, string>
    {
        public async Task<string> Handle(Command request, CancellationToken cancellationToken)
        {
            var user = await userAccessor.GetUserAsync();
            var league = mapper.Map<League>(request.LeagueDto);

            if (league.Members.Any(m => m.UserId == user.Id))
            {
                league.Members.First(m => m.UserId == user.Id).IsAdmin = true;
            }
            else
            {
                league.Members.Add(new LeagueMember
                {
                    UserId = user.Id,
                    DisplayName = user.DisplayName ?? "Admin",
                    IsAdmin = true
                });
            }

            context.Leagues.Add(league);

            var res = await context.SaveChangesAsync(cancellationToken) > 0;

            if (!res) throw new Exception("Failed to create leaderboard");

            return league.Id;
        }
    }
}
