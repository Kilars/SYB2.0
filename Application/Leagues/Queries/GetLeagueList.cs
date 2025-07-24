using System;
using Application.Core;
using Application.Leagues.DTOs;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Leagues.Queries;

public class GetLeagueList
{
    public class Query : IRequest<Result<List<LeagueDto>>> { }

    public class Handler(AppDbContext context, IMapper mapper) : IRequestHandler<Query, Result<List<LeagueDto>>>
    {
        public async Task<Result<List<LeagueDto>>> Handle(Query request, CancellationToken cancellationToken)
        {
            return Result<List<LeagueDto>>.Success(
                await context.Leagues
                .ProjectTo<LeagueDto>(mapper.ConfigurationProvider)
                .ToListAsync(cancellationToken)
            );
        }
    }
}
