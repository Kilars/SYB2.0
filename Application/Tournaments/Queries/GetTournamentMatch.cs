using System;
using Application.Core;
using Application.Matches.DTOs;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Tournaments.Queries;

public class GetTournamentMatch
{
    public class Query : IRequest<Result<MatchDto>>
    {
        public required string TournamentId { get; set; }
        public required int MatchNumber { get; set; }
    }

    public class Handler(AppDbContext context, IMapper mapper) : IRequestHandler<Query, Result<MatchDto>>
    {
        public async Task<Result<MatchDto>> Handle(Query request, CancellationToken cancellationToken)
        {
            var match = await context.Matches
                .Include(x => x.Rounds)
                .Include(x => x.PlayerOne).ThenInclude(p => p!.User)
                .Include(x => x.PlayerTwo).ThenInclude(p => p!.User)
                .FirstOrDefaultAsync(x =>
                    x.CompetitionId == request.TournamentId && x.MatchNumber == request.MatchNumber,
                    cancellationToken);

            if (match == null) return Result<MatchDto>.Failure("Match not found", 404);

            var matchDto = mapper.Map<MatchDto>(match);
            return Result<MatchDto>.Success(matchDto);
        }
    }
}
