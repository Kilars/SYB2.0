using System;
using Application.Core;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Matches.Commands;

public class CompleteFfaMatch
{
    public class Command : IRequest<Result<Unit>>
    {
        public required string CompetitionId { get; set; }
        public required int BracketNumber { get; set; }
        public required int MatchNumber { get; set; }
        public required string WinnerUserId { get; set; }
        public string? SecondPlaceUserId { get; set; }
        public string? ThirdPlaceUserId { get; set; }
        public string? FourthPlaceUserId { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            var match = await context.Matches
                .FirstOrDefaultAsync(m =>
                    m.CompetitionId == request.CompetitionId
                    && m.BracketNumber == request.BracketNumber
                    && m.MatchNumber == request.MatchNumber,
                    cancellationToken);

            if (match == null)
                return Result<Unit>.Failure("Match not found.", 404);

            if (match.PlayerCount <= 2)
                return Result<Unit>.Failure("This endpoint is for FFA matches (PlayerCount > 2) only.", 400);

            // Validate that all provided userIds are actual participants
            var participants = new HashSet<string>(StringComparer.Ordinal);
            if (!string.IsNullOrEmpty(match.PlayerOneUserId)) participants.Add(match.PlayerOneUserId);
            if (!string.IsNullOrEmpty(match.PlayerTwoUserId)) participants.Add(match.PlayerTwoUserId);
            if (!string.IsNullOrEmpty(match.PlayerThreeUserId)) participants.Add(match.PlayerThreeUserId);
            if (!string.IsNullOrEmpty(match.PlayerFourUserId)) participants.Add(match.PlayerFourUserId);

            if (!participants.Contains(request.WinnerUserId))
                return Result<Unit>.Failure($"WinnerUserId '{request.WinnerUserId}' is not a participant in this match.", 400);

            if (request.SecondPlaceUserId != null && !participants.Contains(request.SecondPlaceUserId))
                return Result<Unit>.Failure($"SecondPlaceUserId '{request.SecondPlaceUserId}' is not a participant in this match.", 400);

            if (request.ThirdPlaceUserId != null && !participants.Contains(request.ThirdPlaceUserId))
                return Result<Unit>.Failure($"ThirdPlaceUserId '{request.ThirdPlaceUserId}' is not a participant in this match.", 400);

            if (request.FourthPlaceUserId != null && !participants.Contains(request.FourthPlaceUserId))
                return Result<Unit>.Failure($"FourthPlaceUserId '{request.FourthPlaceUserId}' is not a participant in this match.", 400);

            // Validate distinct placements
            var placed = new List<string> { request.WinnerUserId };
            if (request.SecondPlaceUserId != null) placed.Add(request.SecondPlaceUserId);
            if (request.ThirdPlaceUserId != null) placed.Add(request.ThirdPlaceUserId);
            if (request.FourthPlaceUserId != null) placed.Add(request.FourthPlaceUserId);

            if (placed.Count != placed.Distinct(StringComparer.Ordinal).Count())
                return Result<Unit>.Failure("Placement userIds must be distinct.", 400);

            // Apply placements
            match.WinnerUserId = request.WinnerUserId;
            match.SecondPlaceUserId = request.SecondPlaceUserId;
            match.ThirdPlaceUserId = request.ThirdPlaceUserId;
            match.FourthPlaceUserId = request.FourthPlaceUserId;
            match.Completed = true;
            match.RegisteredTime ??= DateTime.UtcNow;

            var res = await context.SaveChangesAsync(cancellationToken) > 0;

            return res
                ? Result<Unit>.Success(Unit.Value)
                : Result<Unit>.Failure("Match could not be completed.", 400);
        }
    }
}
