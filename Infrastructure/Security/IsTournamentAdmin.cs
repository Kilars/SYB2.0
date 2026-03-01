using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Infrastructure.Security;

public class IsTournamentAdmin : IAuthorizationRequirement { }

public class IsTournamentAdminHandler(AppDbContext dbContext, IHttpContextAccessor httpContextAccessor)
    : AuthorizationHandler<IsTournamentAdmin>
{
    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, IsTournamentAdmin requirement)
    {
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return;

        var httpContext = httpContextAccessor.HttpContext;
        if (httpContext?.GetRouteValue("tournamentId") is not string tournamentId) return;

        var member = await dbContext.TournamentMembers
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.UserId == userId && x.TournamentId == tournamentId);

        if (member == null) return;
        if (member.IsAdmin) context.Succeed(requirement);
    }
}
