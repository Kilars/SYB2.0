using System;
using Application.Core;
using Application.Matches.DTOs;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Matches.Queries;

public class GetMatchDetails
{
    public class Query : IRequest<Result<MatchDto>>
    {
        public required string CompetitionId { get; set; }
        public required int BracketNumber { get; set; }
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
                .Include(x => x.PlayerThree)
                .Include(x => x.PlayerThree!.User)
                .Include(x => x.PlayerFour)
                .Include(x => x.PlayerFour!.User)
                .FirstOrDefaultAsync(x =>
                    x.CompetitionId == request.CompetitionId && x.BracketNumber == request.BracketNumber && x.MatchNumber == request.MatchNumber,
                    cancellationToken
                );

            if (match == null) return Result<MatchDto>.Failure("Match not found", 404);

            var matchDto = mapper.Map<MatchDto>(match);

            return Result<MatchDto>.Success(matchDto);
        }
    }
}
