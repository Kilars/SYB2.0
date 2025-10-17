using System;
using System.ComponentModel.DataAnnotations.Schema;
using Application.Core;
using Application.Leagues.DTOs;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Matches.Queries;

public class GetUserMatches
{
    public class Query : IRequest<Result<List<MatchDto>>>
    {
        public required string Id { get; set; }
    }
    public class Handler(AppDbContext context, IMapper mapper) : IRequestHandler<Query, Result<List<MatchDto>>>
    {
        public async Task<Result<List<MatchDto>>> Handle(Query request, CancellationToken cancellationToken)
        {
            var matches = await context.Matches
                .Where(
                    match =>
                        match.PlayerTwoUserId == request.Id ||
                        match.PlayerOneUserId == request.Id
                )
                .Include(m => m.Rounds)
                .Include(m => m.PlayerOne)
                .Include(m => m.PlayerTwo)
                .ToListAsync(cancellationToken: cancellationToken);

            var mapped = mapper.Map<List<MatchDto>>(matches);

            return Result<List<MatchDto>>.Success(mapped);
        }
    }
}
