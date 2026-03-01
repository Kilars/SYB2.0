using System;
using Application.Core;
using Application.Tournaments.DTOs;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Tournaments.Queries;

public class GetTournamentMatch
{
    public class Query : IRequest<Result<TournamentMatchDto>>
    {
        public required string TournamentId { get; set; }
        public required int MatchNumber { get; set; }
    }

    public class Handler(AppDbContext context, IMapper mapper) : IRequestHandler<Query, Result<TournamentMatchDto>>
    {
        public async Task<Result<TournamentMatchDto>> Handle(Query request, CancellationToken cancellationToken)
        {
            var match = await context.TournamentMatches
                .Include(x => x.Rounds)
                .Include(x => x.PlayerOne).ThenInclude(p => p!.User)
                .Include(x => x.PlayerTwo).ThenInclude(p => p!.User)
                .FirstOrDefaultAsync(x =>
                    x.TournamentId == request.TournamentId && x.MatchNumber == request.MatchNumber,
                    cancellationToken);

            if (match == null) return Result<TournamentMatchDto>.Failure("Match not found", 404);

            var matchDto = mapper.Map<TournamentMatchDto>(match);
            return Result<TournamentMatchDto>.Success(matchDto);
        }
    }
}
