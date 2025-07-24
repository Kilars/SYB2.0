using System;
using System.Reflection.Metadata.Ecma335;
using System.Security.Cryptography.X509Certificates;
using Application.Core;
using Application.Leagues.DTOs;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using Persistence;

namespace Application.Leagues.Queries;

public class GetLeagueDetails
{
    public class Query : IRequest<Result<LeagueDto>>
    {
        public required string Id { get; set; }
    }

    public class Handler(AppDbContext context, IMapper mapper) : IRequestHandler<Query, Result<LeagueDto>>
    {
        public async Task<Result<LeagueDto>> Handle(Query request, CancellationToken cancellationToken)
        {
            var league = await context.Leagues.ProjectTo<LeagueDto>(mapper.ConfigurationProvider)
                .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

            if (league == null) return Result<LeagueDto>.Failure("League not found", 404);

            var leagueDto = mapper.Map<LeagueDto>(league);

            return Result<LeagueDto>.Success(leagueDto);
        }
    }
}