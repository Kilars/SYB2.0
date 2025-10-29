using System;
using Application.Core;
using Application.Interfaces;
using Application.Leagues.DTOs;
using AutoMapper;
using Domain;
using MediatR;
using Persistence;

namespace Application.Leagues.Commands;

public class CreateLeague
{
    public class Command : IRequest<Result<string>>
    {
        public required CreateLeagueDto LeagueDto { get; set; }
    }

    public class Handler(AppDbContext context, IMapper mapper, IUserAccessor userAccessor) : IRequestHandler<Command, Result<string>>
    {
        public async Task<Result<string>> Handle(Command request, CancellationToken cancellationToken)
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
                    IsAdmin = true
                });
            }

            context.Leagues.Add(league);

            var res = await context.SaveChangesAsync(cancellationToken) > 0;

            return res
             ? Result<string>.Success(league.Id)
             : Result<string>.Failure("Failed to create leaderboard", 400);
        }
    }
}
