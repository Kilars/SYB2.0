using System;
using Application.Core;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Characters.Queries;

public class GetCharacterList
{
    public class Query : IRequest<Result<List<Character>>> { }

    public class Handler(AppDbContext context) : IRequestHandler<Query, Result<List<Character>>>
    {
        public async Task<Result<List<Character>>> Handle(Query request, CancellationToken cancellationToken)
        {
            return Result<List<Character>>.Success(await context.Characters.ToListAsync(cancellationToken));
        }
    }
}
