using System;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Infrastructure.Security;

public class IsMatchComplete : IAuthorizationRequirement
{

}

public class IsMatchCompleteHandler(AppDbContext dbContext, IHttpContextAccessor httpContextAccessor) : AuthorizationHandler<IsMatchComplete>
{
    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, IsMatchComplete requirement)
    {
        var httpContext = httpContextAccessor.HttpContext;

        if (httpContext?.GetRouteValue("competitionId") is not string competitionId)
        {
            context.Fail(new AuthorizationFailureReason(this, "competitionId is not a string"));
            return;
        }

        if (httpContext?.GetRouteValue("bracketNumber") is not string bracketNumber) return;
        if (httpContext?.GetRouteValue("matchNumber") is not string matchNumber) return;

        var match = await dbContext.Matches
            .AsNoTracking()
            .SingleOrDefaultAsync(x =>
                x.CompetitionId == competitionId
                && x.BracketNumber == int.Parse(bracketNumber)
                && x.MatchNumber == int.Parse(matchNumber)
            );

        if (match == null)
        {
            context.Fail(new AuthorizationFailureReason(this, "No match found"));
            return;
        }

        if (match.Completed) context.Succeed(requirement);
    }
}
