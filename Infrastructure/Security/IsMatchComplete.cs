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

        if (httpContext?.GetRouteValue("id") is not string matchId)
        {
            context.Fail(new AuthorizationFailureReason(this, "Parameter id is not a string"));
            return;
        }

        var compositeIdStrings = matchId.Split("_");

        if (compositeIdStrings.Length != 3)
        {
            context.Fail(new AuthorizationFailureReason(this, "The id does not match the composite format"));
            return;
        }
        //TODO: Remove composite idStrings
        var leagueId = compositeIdStrings[0];
        var split = compositeIdStrings[1];
        var matchIndex = compositeIdStrings[2];

        var match = await dbContext.Matches
            .AsNoTracking()
            .SingleOrDefaultAsync(x =>
                x.LeagueId == leagueId
                && x.Split.ToString() == split
                && x.MatchIndex.ToString() == matchIndex
            );



        if (match == null)
        {
            context.Fail(new AuthorizationFailureReason(this, "No match found"));
            return;
        }

        if (match.Completed) context.Succeed(requirement);
    }
}
