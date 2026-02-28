using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Infrastructure.Security;

public class IsAdminRequirement : IAuthorizationRequirement
{

}

public class IsAdminRequirementHandler(AppDbContext dbContext, IHttpContextAccessor httpContextAccessor)
    : AuthorizationHandler<IsAdminRequirement>
{
    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, IsAdminRequirement requirement)
    {
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return;

        var httpContext = httpContextAccessor.HttpContext;

        if (httpContext?.GetRouteValue("leagueId") is not string leagueId) return;

        var member = await dbContext.LeagueMembers
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.UserId == userId && x.LeagueId == leagueId);

        if (member == null) return;

        if (member.IsAdmin) context.Succeed(requirement);
    }
}