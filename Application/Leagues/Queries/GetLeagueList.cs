using System;
using Application.Leagues.DTOs;
using AutoMapper;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Leagues.Queries;

public class GetLeagueList
{
    public class Query : IRequest<List<LeagueDto>> {}

    public class Handler(AppDbContext context, IMapper mapper) : IRequestHandler<Query, List<LeagueDto>>
    {
        public async Task<List<LeagueDto>> Handle(Query request, CancellationToken cancellationToken)
        {
            return await context.Leagues
                .Include(x => x.Members)
                .Select(league => mapper.Map<LeagueDto>(league))
                .ToListAsync(cancellationToken);
        }
    }
}
