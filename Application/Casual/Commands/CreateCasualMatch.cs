using System;
using Application.Casual.DTOs;
using Application.Core;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Casual.Commands;

public class CreateCasualMatch
{
    public class Command : IRequest<Result<Unit>>
    {
        public required CreateCasualMatchDto CasualMatchDto { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            var dto = request.CasualMatchDto;

            var casual = await context.Casuals
                .FirstOrDefaultAsync(c => c.Id == CasualConstants.GlobalCasualId, cancellationToken);

            if (casual == null)
                return Result<Unit>.Failure("Casual competition not found", 404);

            // Collect all participant userIds, deduplicated, excluding nulls.
            var participantIds = new[] { dto.PlayerOneUserId, dto.PlayerTwoUserId, dto.PlayerThreeUserId, dto.PlayerFourUserId }
                .Where(id => !string.IsNullOrEmpty(id))
                .Distinct()
                .ToList()!;

            // PHASE 1: Lazy-join — insert CompetitionMember rows for any new participants.
            // This SaveChangesAsync MUST happen before the Match insert because the
            // composite FKs on Match.PlayerThree/Four → CompetitionMember (added in task 042)
            // require the member rows to exist before the Match FK is validated.
            var existingMembers = await context.CompetitionMembers
                .Where(m => m.CompetitionId == CasualConstants.GlobalCasualId
                    && participantIds.Contains(m.UserId))
                .Select(m => m.UserId)
                .ToListAsync(cancellationToken);

            foreach (var userId in participantIds)
            {
                if (!existingMembers.Contains(userId))
                {
                    context.CompetitionMembers.Add(new CompetitionMember
                    {
                        UserId = userId,
                        CompetitionId = CasualConstants.GlobalCasualId,
                        IsAdmin = false
                    });
                }
            }

            await context.SaveChangesAsync(cancellationToken);

            // Auto-increment MatchNumber
            var maxMatchNumber = await context.Matches
                .Where(m => m.CompetitionId == CasualConstants.GlobalCasualId)
                .MaxAsync(m => (int?)m.MatchNumber, cancellationToken) ?? 0;

            var matchNumber = maxMatchNumber + 1;

            var match = new Match
            {
                CompetitionId = CasualConstants.GlobalCasualId,
                BracketNumber = 1,
                MatchNumber = matchNumber,
                PlayerCount = dto.PlayerCount,
                PlayerOneUserId = dto.PlayerOneUserId,
                PlayerTwoUserId = dto.PlayerTwoUserId,
                PlayerThreeUserId = dto.PlayerThreeUserId,
                PlayerFourUserId = dto.PlayerFourUserId,
                WinnerUserId = dto.WinnerUserId,
                SecondPlaceUserId = dto.SecondPlaceUserId,
                ThirdPlaceUserId = dto.ThirdPlaceUserId,
                FourthPlaceUserId = dto.FourthPlaceUserId,
                Completed = true,
                RegisteredTime = DateTime.UtcNow
            };

            context.Matches.Add(match);

            // Exactly one Round row per match (single-game pattern for all N).
            var round = new Round
            {
                CompetitionId = CasualConstants.GlobalCasualId,
                BracketNumber = 1,
                MatchNumber = matchNumber,
                RoundNumber = 1,
                PlayerOneCharacterId = dto.PlayerOneCharacterId,
                PlayerTwoCharacterId = dto.PlayerTwoCharacterId,
                PlayerThreeCharacterId = dto.PlayerThreeCharacterId,
                PlayerFourCharacterId = dto.PlayerFourCharacterId,
                WinnerUserId = dto.WinnerUserId,
                Completed = true
            };

            context.Rounds.Add(round);

            var result = await context.SaveChangesAsync(cancellationToken) > 0;

            return result
                ? Result<Unit>.Success(Unit.Value)
                : Result<Unit>.Failure("Failed to create casual match", 400);
        }
    }
}
