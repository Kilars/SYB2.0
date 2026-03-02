using System;
using Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Infrastructure.Security;

public class IsCompetitionPlanned : IAuthorizationRequirement { }

public class IsCompetitionPlannedHandler(AppDbContext dbContext, IHttpContextAccessor httpContextAccessor)
    : AuthorizationHandler<IsCompetitionPlanned>
{
    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, IsCompetitionPlanned requirement)
    {
        var httpContext = httpContextAccessor.HttpContext;
        if (httpContext?.GetRouteValue("competitionId") is not string competitionId) return;

        var competition = await dbContext.Competitions.FindAsync(competitionId);
        if (competition == null) return;

        if (competition.Status == CompetitionStatus.Planned) context.Succeed(requirement);
    }
}
