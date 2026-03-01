using Application.Core;
using Application.Interfaces;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Guests.Commands;

public class MergeGuest
{
    public class Command : IRequest<Result<Unit>>
    {
        public required string GuestUserId { get; set; }
        public required string TargetUserId { get; set; }
    }

    public class Handler(AppDbContext context, IUserAccessor userAccessor) : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken ct)
        {
            var guestUser = await context.Users.FindAsync(new object[] { request.GuestUserId }, ct);
            if (guestUser == null) return Result<Unit>.Failure("Guest user not found", 404);
            if (!guestUser.IsGuest) return Result<Unit>.Failure("Source user is not a guest", 400);

            var targetUser = await context.Users.FindAsync(new object[] { request.TargetUserId }, ct);
            if (targetUser == null) return Result<Unit>.Failure("Target user not found", 404);
            if (targetUser.IsGuest) return Result<Unit>.Failure("Target user cannot be a guest", 400);

            var guestMemberships = await context.LeagueMembers
                .Where(lm => lm.UserId == request.GuestUserId)
                .ToListAsync(ct);

            if (guestMemberships.Count == 0) return Result<Unit>.Failure("Guest has no league memberships", 400);

            // Auth check: caller must be admin of at least 1 league containing the guest
            var callerId = userAccessor.GetUserId();
            var guestLeagueIds = guestMemberships.Select(lm => lm.LeagueId).ToList();
            var callerIsAdmin = await context.LeagueMembers
                .AnyAsync(lm => lm.UserId == callerId && guestLeagueIds.Contains(lm.LeagueId) && lm.IsAdmin, ct);
            if (!callerIsAdmin) return Result<Unit>.Failure("You must be admin of a league containing this guest", 403);

            // Conflict check: target user must not already be a member of any league the guest belongs to
            var targetLeagueIds = await context.LeagueMembers
                .Where(lm => lm.UserId == request.TargetUserId)
                .Select(lm => lm.LeagueId)
                .ToListAsync(ct);

            var conflictingLeagues = guestLeagueIds.Intersect(targetLeagueIds).ToList();
            if (conflictingLeagues.Any())
                return Result<Unit>.Failure("Target user is already a member of a league the guest belongs to", 400);

            using var transaction = await context.Database.BeginTransactionAsync(ct);

            try
            {
                // 1. Insert new LeagueMember records for target user
                var newMembers = guestMemberships.Select(gm => new LeagueMember
                {
                    UserId = request.TargetUserId,
                    LeagueId = gm.LeagueId!,
                    IsAdmin = gm.IsAdmin,
                    DateJoined = gm.DateJoined
                }).ToList();

                context.LeagueMembers.AddRange(newMembers);
                await context.SaveChangesAsync(ct);

                // 2. Update Match FK references
                await context.Matches
                    .Where(m => m.PlayerOneUserId == request.GuestUserId)
                    .ExecuteUpdateAsync(s => s.SetProperty(m => m.PlayerOneUserId, request.TargetUserId), ct);

                await context.Matches
                    .Where(m => m.PlayerTwoUserId == request.GuestUserId)
                    .ExecuteUpdateAsync(s => s.SetProperty(m => m.PlayerTwoUserId, request.TargetUserId), ct);

                await context.Matches
                    .Where(m => m.WinnerUserId == request.GuestUserId)
                    .ExecuteUpdateAsync(s => s.SetProperty(m => m.WinnerUserId, request.TargetUserId), ct);

                // 3. Update Round FK references
                await context.Rounds
                    .Where(r => r.WinnerUserId == request.GuestUserId)
                    .ExecuteUpdateAsync(s => s.SetProperty(r => r.WinnerUserId, request.TargetUserId), ct);

                // 4. Cleanup: remove old guest LeagueMember records and guest User
                context.LeagueMembers.RemoveRange(guestMemberships);
                context.Users.Remove(guestUser);
                await context.SaveChangesAsync(ct);

                await transaction.CommitAsync(ct);

                return Result<Unit>.Success(Unit.Value);
            }
            catch
            {
                await transaction.RollbackAsync(ct);
                throw;
            }
        }
    }
}
