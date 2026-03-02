using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Infrastructure.Security;

public class IsCompetitionAdmin : IAuthorizationRequirement { }

public class IsCompetitionAdminHandler(AppDbContext dbContext, IHttpContextAccessor httpContextAccessor)
    : AuthorizationHandler<IsCompetitionAdmin>
{
    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, IsCompetitionAdmin requirement)
    {
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return;

        var httpContext = httpContextAccessor.HttpContext;
        if (httpContext?.GetRouteValue("competitionId") is not string competitionId) return;

        var member = await dbContext.CompetitionMembers
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.UserId == userId && x.CompetitionId == competitionId);

        if (member == null) return;
        if (member.IsAdmin) context.Succeed(requirement);
    }
}
