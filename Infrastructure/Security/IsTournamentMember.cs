using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Infrastructure.Security;

public class IsTournamentMember : IAuthorizationRequirement { }

public class IsTournamentMemberHandler(AppDbContext dbContext, IHttpContextAccessor httpContextAccessor)
    : AuthorizationHandler<IsTournamentMember>
{
    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, IsTournamentMember requirement)
    {
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return;

        var httpContext = httpContextAccessor.HttpContext;
        if (httpContext?.GetRouteValue("tournamentId") is not string tournamentId)
        {
            context.Fail(new AuthorizationFailureReason(this, "TournamentId is not a string"));
            return;
        }

        var tournament = await dbContext.Tournaments
            .AsNoTracking()
            .Include(t => t.Members)
            .FirstOrDefaultAsync(x => x.Id == tournamentId);

        if (tournament == null) context.Succeed(requirement);
        else if (tournament.Members.Any(x => x.UserId == userId)) context.Succeed(requirement);
    }
}
