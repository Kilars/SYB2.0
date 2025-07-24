using System;
using Application.Core;
using Application.Leagues.DTOs;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Matches.Queries;

public class GetMatchDetails
{
    public class Query : IRequest<Result<MatchDto>>
    {
        public required string Id { get; set; }
    }

    public class Handler(AppDbContext context, IMapper mapper) : IRequestHandler<Query, Result<MatchDto>>
    {
        public async Task<Result<MatchDto>> Handle(Query request, CancellationToken cancellationToken)
        {
            var compositeIdSplit = request.Id.Split('_');
            if (compositeIdSplit.Length != 3) return Result<MatchDto>.Failure("Match not found, invalid matchId", 404);
            var leagueId = compositeIdSplit[0];
            var split = compositeIdSplit[1];
            var matchIndex = compositeIdSplit[2];

            var match = await context.Matches
                .Include(x => x.Rounds)
                .Include(x => x.PlayerOne)
                .Include(x => x.PlayerTwo)
                .FirstOrDefaultAsync(x =>
                    x.LeagueId == leagueId && x.Split.ToString() == split && x.MatchIndex.ToString() == matchIndex,
                    cancellationToken
                );

            if (match == null) return Result<MatchDto>.Failure("Match not found", 404);

            var matchDto = mapper.Map<MatchDto>(match);

            return Result<MatchDto>.Success(matchDto);
        }
    }
}
