using System;
using Application.Leagues.DTOs;
using Application.Matches.Commands;
using Application.Matches.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class MatchesController : BaseApiController
{
    [Authorize(Policy = "IsLeagueMember")]
    [HttpGet("{leagueId}/split/{split}/match/{matchNumber}")]
    public async Task<ActionResult<MatchDto>> GetMatch(string leagueId, int split, int matchNumber)
    {
        return HandleResult(await Mediator.Send(new GetMatchDetails.Query { LeagueId = leagueId, Split = split, MatchNumber = matchNumber }));
    }

    [HttpPost("{leagueId}/split/{split}/match/{matchNumber}/complete")]
    [Authorize(Policy = "IsLeagueMember")]
    [Authorize(Policy = "IsMatchEditable")]
    public async Task<ActionResult<MatchDto>> CompleteMatch(string leagueId, int split, int matchNumber, List<RoundDto> rounds)
    {
        return HandleResult(await Mediator.Send(new CompleteMatch.Command { LeagueId = leagueId, Split = split, MatchNumber = matchNumber, Rounds = rounds }));
    }

    [HttpPost("{leagueId}/split/{split}/match/{matchNumber}/reopen")]
    [Authorize(Policy = "IsLeagueMember")]
    [Authorize(Policy = "IsMatchComplete")]
    public async Task<ActionResult<MatchDto>> ReopenMatch(string leagueId, int split, int matchNumber)
    {
        return HandleResult(await Mediator.Send(new ReopenMatch.Command { LeagueId = leagueId, Split = split, MatchNumber = matchNumber }));
    }

    [HttpGet("user/{id}")]
    public async Task<ActionResult<MatchDto>> GetUserMatches(string id)
    {
        return HandleResult(await Mediator.Send(new GetUserMatches.Query { Id = id }));
    }
}
