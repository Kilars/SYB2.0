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

            // Lazy-join: add players as CompetitionMembers if not already
            var existingMembers = await context.CompetitionMembers
                .Where(m => m.CompetitionId == CasualConstants.GlobalCasualId
                    && (m.UserId == dto.PlayerOneUserId || m.UserId == dto.PlayerTwoUserId))
                .Select(m => m.UserId)
                .ToListAsync(cancellationToken);

            if (!existingMembers.Contains(dto.PlayerOneUserId))
            {
                context.CompetitionMembers.Add(new CompetitionMember
                {
                    UserId = dto.PlayerOneUserId,
                    CompetitionId = CasualConstants.GlobalCasualId,
                    IsAdmin = false
                });
            }

            if (!existingMembers.Contains(dto.PlayerTwoUserId))
            {
                context.CompetitionMembers.Add(new CompetitionMember
                {
                    UserId = dto.PlayerTwoUserId,
                    CompetitionId = CasualConstants.GlobalCasualId,
                    IsAdmin = false
                });
            }

            // Save members first to satisfy FK constraints
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
                PlayerOneUserId = dto.PlayerOneUserId,
                PlayerTwoUserId = dto.PlayerTwoUserId,
                WinnerUserId = dto.WinnerUserId,
                Completed = true,
                RegisteredTime = DateTime.UtcNow
            };

            context.Matches.Add(match);

            var round = new Round
            {
                CompetitionId = CasualConstants.GlobalCasualId,
                BracketNumber = 1,
                MatchNumber = matchNumber,
                RoundNumber = 1,
                PlayerOneCharacterId = dto.PlayerOneCharacterId,
                PlayerTwoCharacterId = dto.PlayerTwoCharacterId,
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
