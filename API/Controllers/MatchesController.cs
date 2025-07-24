using System;
using Application.Leagues.DTOs;
using Application.Matches.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class MatchesController : BaseApiController
{
    [HttpGet("{id}")]
    [Authorize (Policy = "IsLeagueMember")]
    public async Task<ActionResult<MatchDto>> GetMatch(string id)
    {
        return HandleResult(await Mediator.Send(new GetMatchDetails.Query { Id = id }));
    }

}
