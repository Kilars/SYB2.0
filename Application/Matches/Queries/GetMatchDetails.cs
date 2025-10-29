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
        public required string LeagueId { get; set; }
        public required int Split { get; set; }
        public required int MatchNumber { get; set; }
    }

    public class Handler(AppDbContext context, IMapper mapper) : IRequestHandler<Query, Result<MatchDto>>
    {
        public async Task<Result<MatchDto>> Handle(Query request, CancellationToken cancellationToken)
        {
            var match = await context.Matches
                .Include(x => x.Rounds)
                .Include(x => x.PlayerOne)
                .Include(x => x.PlayerOne!.User)
                .Include(x => x.PlayerTwo)
                .Include(x => x.PlayerTwo!.User)
                .FirstOrDefaultAsync(x =>
                    x.LeagueId == request.LeagueId && x.Split == request.Split && x.MatchNumber == request.MatchNumber,
                    cancellationToken
                );

            if (match == null) return Result<MatchDto>.Failure("Match not found", 404);

            var matchDto = mapper.Map<MatchDto>(match);

            return Result<MatchDto>.Success(matchDto);
        }
    }
}
