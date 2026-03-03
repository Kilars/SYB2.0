using System;
using Application.Casual.Commands;
using Application.Casual.DTOs;
using Application.Casual.Queries;
using Application.Matches.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class CasualController() : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<List<MatchDto>>> GetCasualMatches()
    {
        return HandleResult(await Mediator.Send(new GetCasualMatches.Query()));
    }

    [HttpPost]
    public async Task<ActionResult> CreateCasualMatch(CreateCasualMatchDto casualMatchDto)
    {
        return HandleResult(await Mediator.Send(new CreateCasualMatch.Command { CasualMatchDto = casualMatchDto }));
    }
}
