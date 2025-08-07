using System;
using Application.Leagues.DTOs;
using Application.Matches.Commands;
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

    [HttpPost("{id}/complete")]
    [Authorize (Policy = "IsLeagueMember")]
    public async Task<ActionResult<MatchDto>> CompleteMatch(string id, List<RoundDto> rounds)
    {
        return HandleResult(await Mediator.Send(new CompleteMatch.Command { MatchId = id, Rounds = rounds }));
    }

}
