using System;
using Application.Core;
using Application.Tournaments.DTOs;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Tournaments.Queries;

public class GetTournamentDetails
{
    public class Query : IRequest<Result<TournamentDto>>
    {
        public required string Id { get; set; }
    }

    public class Handler(AppDbContext context, IMapper mapper) : IRequestHandler<Query, Result<TournamentDto>>
    {
        public async Task<Result<TournamentDto>> Handle(Query request, CancellationToken cancellationToken)
        {
            var tournament = await context.Tournaments
                .Include(t => t.Members).ThenInclude(m => m.User)
                .Include(t => t.Matches).ThenInclude(m => m.Rounds)
                .Include(t => t.Matches).ThenInclude(m => m.PlayerOne).ThenInclude(p => p!.User)
                .Include(t => t.Matches).ThenInclude(m => m.PlayerTwo).ThenInclude(p => p!.User)
                .AsSplitQuery()
                .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);

            if (tournament == null)
                return Result<TournamentDto>.Failure("Tournament not found", 404);

            var tournamentDto = mapper.Map<TournamentDto>(tournament);
            return Result<TournamentDto>.Success(tournamentDto);
        }
    }
}
