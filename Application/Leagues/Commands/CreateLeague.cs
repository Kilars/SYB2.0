using System;
using Application.Leagues.DTOs;
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

    public class Handler(AppDbContext context) : IRequestHandler<Command, string>
    {
        public async Task<string> Handle(Command request, CancellationToken cancellationToken)
        {
            List<LeagueMember> members = [..
                request.LeagueDto.Members.Select<string, LeagueMember>(
                    s => new LeagueMember() { DisplayName = s }
                )
            ];
            League league = new()
            {
                Title = request.LeagueDto.Title,
                Description = request.LeagueDto.Description,
                StartDate = request.LeagueDto.StartDate,
                Members = members,
            };


            context.Leagues.Add(league);

            var res = await context.SaveChangesAsync(cancellationToken) > 0;

            if (!res) throw new Exception("Failed to create leaderboard");

            return league.Id;
        }
    }
}
