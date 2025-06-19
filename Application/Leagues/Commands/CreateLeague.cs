using System;
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

    public class Handler(AppDbContext context, IMapper mapper) : IRequestHandler<Command, string>
    {
        public async Task<string> Handle(Command request, CancellationToken cancellationToken)
        {
            var league = mapper.Map<League>(request.LeagueDto);

            context.Leagues.Add(league);

            var res = await context.SaveChangesAsync(cancellationToken) > 0;

            if (!res) throw new Exception("Failed to create leaderboard");

            return league.Id;
        }
    }
}
