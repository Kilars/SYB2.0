using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Infrastructure.Security;

public class IsLeagueMember : IAuthorizationRequirement
{

}
public class IsLeagueMemberHandler(AppDbContext dbContext, IHttpContextAccessor httpContextAccessor)
    : AuthorizationHandler<IsLeagueMember>
{
    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, IsLeagueMember requirement)
    {
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return;

        var httpContext = httpContextAccessor.HttpContext;

        if (httpContext?.GetRouteValue("id") is not string id) return;

        var leagueId = id.Split("_")[0];
        var league = await dbContext.Leagues.AsNoTracking().Include(l => l.Members).FirstOrDefaultAsync(x => x.Id == leagueId);
        if (league == null) context.Succeed(requirement);
        else if (league.Members.Any(x => x.UserId == userId)) context.Succeed(requirement);
    }
}
