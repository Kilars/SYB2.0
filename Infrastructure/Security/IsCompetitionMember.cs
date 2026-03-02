using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Infrastructure.Security;

public class IsCompetitionMember : IAuthorizationRequirement { }

public class IsCompetitionMemberHandler(AppDbContext dbContext, IHttpContextAccessor httpContextAccessor)
    : AuthorizationHandler<IsCompetitionMember>
{
    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, IsCompetitionMember requirement)
    {
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return;

        var httpContext = httpContextAccessor.HttpContext;
        if (httpContext?.GetRouteValue("competitionId") is not string competitionId)
        {
            context.Fail(new AuthorizationFailureReason(this, "competitionId is not a string"));
            return;
        }

        var competition = await dbContext.Competitions
            .AsNoTracking()
            .Include(c => c.Members)
            .FirstOrDefaultAsync(x => x.Id == competitionId);

        if (competition == null) context.Succeed(requirement);
        else if (competition.Members.Any(x => x.UserId == userId)) context.Succeed(requirement);
    }
}
