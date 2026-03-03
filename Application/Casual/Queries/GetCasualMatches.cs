using System;
using Application.Core;
using Application.Matches.DTOs;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Casual.Queries;

public class GetCasualMatches
{
    public class Query : IRequest<Result<List<MatchDto>>>
    {
    }

    public class Handler(AppDbContext context, IMapper mapper) : IRequestHandler<Query, Result<List<MatchDto>>>
    {
        public async Task<Result<List<MatchDto>>> Handle(Query request, CancellationToken cancellationToken)
        {
            var matches = await context.Matches
                .Where(m => m.CompetitionId == CasualConstants.GlobalCasualId)
                .Include(m => m.Rounds)
                .Include(m => m.PlayerOne)
                .Include(m => m.PlayerOne!.User)
                .Include(m => m.PlayerTwo)
                .Include(m => m.PlayerTwo!.User)
                .OrderByDescending(m => m.RegisteredTime)
                .Take(50)
                .ToListAsync(cancellationToken);

            var mapped = mapper.Map<List<MatchDto>>(matches);

            return Result<List<MatchDto>>.Success(mapped);
        }
    }
}
