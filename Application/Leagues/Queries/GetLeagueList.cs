using System;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Leagues.Queries;

public class GetLeagueList
{
    public class Query : IRequest<List<League>> {}

    public class Handler(AppDbContext context) : IRequestHandler<Query, List<League>>
    {
        public async Task<List<League>> Handle(Query request, CancellationToken cancellationToken)
        {
            return await context.Leagues.Include(x => x.Members).ToListAsync(cancellationToken);
        }
    }
}
