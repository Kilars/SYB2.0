using System;
using Application.Leagues.DTOs;
using AutoMapper;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using Persistence;

namespace Application.Leagues.Queries;

public class GetLeagueDetails
{
    public class Query : IRequest<LeagueDto>
    {
        public required string Id { get; set; }
    }

    public class Handler(AppDbContext context, IMapper mapper) : IRequestHandler<Query, LeagueDto>
    {
        public async Task<LeagueDto> Handle(Query request, CancellationToken cancellationToken)
        {
            var league = await context.Leagues
                .Include(x => x.Members)
                .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken)
                    ?? throw new Exception("Activity not found");

            var leagueDto = mapper.Map<LeagueDto>(league);

            return leagueDto;
        }
    }
}