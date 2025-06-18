using System;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using Persistence;

namespace Application.Leagues.Queries;

public class GetLeagueDetails
{
    public class Query : IRequest<League>
    {
        public required string Id { get; set; }
    }

    public class Command(AppDbContext context) : IRequestHandler<Query, League>
    {
        public async Task<League> Handle(Query request, CancellationToken cancellationToken)
        {
            var league = await context.Leagues
                .Include(x => x.Members)
                .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken)
                    ?? throw new Exception("Activity not found");

            return league;
        }
    }
}
