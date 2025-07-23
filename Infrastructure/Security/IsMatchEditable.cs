using System;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
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

        if (httpContext?.GetRouteValue("id") is not string matchId) return;

        var compositeIdStrings = matchId.Split("_");

        if (compositeIdStrings.Length != 3) return;
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

        if (match == null) return;

        if (!match.Completed) context.Succeed(requirement);
    }
}
