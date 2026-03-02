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

        if (httpContext?.GetRouteValue("competitionId") is not string competitionId) return;
        if (httpContext?.GetRouteValue("bracketNumber") is not string bracketNumber) return;
        if (httpContext?.GetRouteValue("matchNumber") is not string matchNumber) return;

        var match = await dbContext.Matches
            .AsNoTracking()
            .SingleOrDefaultAsync(x =>
                x.CompetitionId == competitionId
                && x.BracketNumber == int.Parse(bracketNumber)
                && x.MatchNumber == int.Parse(matchNumber)
            );

        if (match == null) return;

        if (!match.Completed) context.Succeed(requirement);
    }
}
