using System;
using Application.Leagues.Commands;
using Application.Leagues.DTOs;
using Application.Leagues.Queries;
using Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class LeaguesController() : BaseApiController
{
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<List<LeagueDto>>> GetLeagues()
    {
        return HandleResult(await Mediator.Send(new GetLeagueList.Query()));
    }
    [HttpGet("{leagueId}")]
    public async Task<ActionResult<LeagueDto>> GetLeagueDetails(string leagueId)
    {
        return HandleResult(await Mediator.Send(new GetLeagueDetails.Query { Id = leagueId }));
    }

    [HttpPost]
    public async Task<ActionResult<string>> CreateLeague(CreateLeagueDto leagueDto)
    {
        return HandleResult(await Mediator.Send(new CreateLeague.Command { LeagueDto = leagueDto }));
    }
    [HttpPut("{leagueId}")]
    [Authorize(Policy = "IsLeagueAdmin")]
    [Authorize(Policy = "IsLeaguePlanned")]
    public async Task<ActionResult> UpdateLeague(string leagueId, UpdateLeagueDto leagueDto)
    {
        leagueDto.Id = leagueId;
        return HandleResult(await Mediator.Send(new UpdateLeague.Command { UpdateLeagueDto = leagueDto }));
    }
    [HttpPost("{leagueId}/status")]
    [Authorize(Policy = "IsLeagueAdmin")]
    public async Task<ActionResult> ChangeLeagueStatus(string leagueId, LeagueStatus status)
    {
        return HandleResult(await Mediator.Send(new ChangeLeagueStatus.Command { LeagueId = leagueId, NewStatus = status }));
    }
    [HttpGet("{leagueId}/leaderboard")]
    [Authorize(Policy = "IsLeagueMember")]
    public async Task<ActionResult> GetLeagueLeaderboard(string leagueId)
    {
        return HandleResult(await Mediator.Send(new GetLeagueLeaderboard.Query { Id = leagueId }));
    }

}
