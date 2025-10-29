using System;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Infrastructure.Security;

public class IsMatchEditable : IAuthorizationRequirement
{

}
public class IsMatchEditableHandler(AppDbContext dbContext, IHttpContextAccessor httpContextAccessor) : AuthorizationHandler<IsMatchEditable>
{
    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, IsMatchEditable requirement)
    {
        var httpContext = httpContextAccessor.HttpContext;

        if (httpContext?.GetRouteValue("leagueId") is not string leagueId) return;
        if (httpContext?.GetRouteValue("split") is not string split) return;
        if (httpContext?.GetRouteValue("matchNumber") is not string matchNumber) return;

        var match = await dbContext.Matches
            .AsNoTracking()
            .SingleOrDefaultAsync(x =>
                x.LeagueId == leagueId
                && x.Split == int.Parse(split)
                && x.MatchNumber == int.Parse(matchNumber)
            );

        if (match == null) return;

        if (!match.Completed) context.Succeed(requirement);
    }
}
