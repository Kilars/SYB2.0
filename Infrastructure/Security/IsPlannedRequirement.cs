using System;
using Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Infrastructure.Security;

public class IsPlannedRequirement : IAuthorizationRequirement
{

}

public class IsPlannerRequirementHandler(AppDbContext dbContext, IHttpContextAccessor httpContextAccessor) : AuthorizationHandler<IsPlannedRequirement>
{
    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, IsPlannedRequirement requirement)
    {
        var httpContext = httpContextAccessor.HttpContext;

        if (httpContext?.GetRouteValue("leagueId") is not string leagueId) return;

        var league = await dbContext.Leagues.FindAsync(leagueId);

        if (league == null) return;

        if (league.Status == LeagueStatus.Planned) context.Succeed(requirement);
    }
}

