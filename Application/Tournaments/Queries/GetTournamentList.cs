using System;
using Application.Core;
using Application.Tournaments.DTOs;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Tournaments.Queries;

public class GetTournamentList
{
    public class Query : IRequest<Result<List<TournamentDto>>> { }

    public class Handler(AppDbContext context, IMapper mapper) : IRequestHandler<Query, Result<List<TournamentDto>>>
    {
        public async Task<Result<List<TournamentDto>>> Handle(Query request, CancellationToken cancellationToken)
        {
            var tournaments = await context.Tournaments
                .Include(t => t.Members).ThenInclude(m => m.User)
                .Include(t => t.Matches).ThenInclude(m => m.Rounds)
                .Include(t => t.Matches).ThenInclude(m => m.PlayerOne).ThenInclude(p => p!.User)
                .Include(t => t.Matches).ThenInclude(m => m.PlayerTwo).ThenInclude(p => p!.User)
                .AsSplitQuery()
                .ToListAsync(cancellationToken);

            var tournamentDtos = mapper.Map<List<TournamentDto>>(tournaments);
            return Result<List<TournamentDto>>.Success(tournamentDtos);
        }
    }
}
