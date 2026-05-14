using System;
using Application.Matches.Commands;
using Application.Matches.DTOs;
using Application.Matches.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class MatchesController : BaseApiController
{
    [Authorize(Policy = "IsCompetitionMember")]
    [HttpGet("{competitionId}/bracket/{bracketNumber}/match/{matchNumber}")]
    public async Task<ActionResult<MatchDto>> GetMatch(string competitionId, int bracketNumber, int matchNumber)
    {
        return HandleResult(await Mediator.Send(new GetMatchDetails.Query { CompetitionId = competitionId, BracketNumber = bracketNumber, MatchNumber = matchNumber }));
    }

    [HttpPost("{competitionId}/bracket/{bracketNumber}/match/{matchNumber}/complete")]
    [Authorize(Policy = "IsCompetitionMember")]
    [Authorize(Policy = "IsMatchEditable")]
    public async Task<ActionResult<MatchDto>> CompleteMatch(string competitionId, int bracketNumber, int matchNumber, List<RoundDto> rounds)
    {
        return HandleResult(await Mediator.Send(new CompleteMatch.Command { CompetitionId = competitionId, BracketNumber = bracketNumber, MatchNumber = matchNumber, Rounds = rounds }));
    }

    [HttpPost("{competitionId}/bracket/{bracketNumber}/match/{matchNumber}/reopen")]
    [Authorize(Policy = "IsCompetitionMember")]
    [Authorize(Policy = "IsMatchComplete")]
    public async Task<ActionResult<MatchDto>> ReopenMatch(string competitionId, int bracketNumber, int matchNumber)
    {
        return HandleResult(await Mediator.Send(new ReopenMatch.Command { CompetitionId = competitionId, BracketNumber = bracketNumber, MatchNumber = matchNumber }));
    }

    [HttpPost("{competitionId}/bracket/{bracketNumber}/match/{matchNumber}/complete-ffa")]
    [Authorize(Policy = "IsCompetitionMember")]
    [Authorize(Policy = "IsMatchEditable")]
    public async Task<ActionResult<MatchDto>> CompleteFfaMatch(string competitionId, int bracketNumber, int matchNumber, FfaMatchBody body)
    {
        return HandleResult(await Mediator.Send(new CompleteFfaMatch.Command
        {
            CompetitionId = competitionId,
            BracketNumber = bracketNumber,
            MatchNumber = matchNumber,
            WinnerUserId = body.WinnerUserId,
            SecondPlaceUserId = body.SecondPlaceUserId,
            ThirdPlaceUserId = body.ThirdPlaceUserId,
            FourthPlaceUserId = body.FourthPlaceUserId,
        }));
    }

    [HttpGet("user/{id}")]
    public async Task<ActionResult<MatchDto>> GetUserMatches(string id)
    {
        return HandleResult(await Mediator.Send(new GetUserMatches.Query { Id = id }));
    }
}
