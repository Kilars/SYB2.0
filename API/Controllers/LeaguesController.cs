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
    [HttpGet("{competitionId}")]
    public async Task<ActionResult<LeagueDto>> GetLeagueDetails(string competitionId)
    {
        return HandleResult(await Mediator.Send(new GetLeagueDetails.Query { Id = competitionId }));
    }

    [HttpPost]
    public async Task<ActionResult<string>> CreateLeague(CreateLeagueDto leagueDto)
    {
        return HandleResult(await Mediator.Send(new CreateLeague.Command { LeagueDto = leagueDto }));
    }
    [HttpPut("{competitionId}")]
    [Authorize(Policy = "IsCompetitionAdmin")]
    [Authorize(Policy = "IsCompetitionPlanned")]
    public async Task<ActionResult> UpdateLeague(string competitionId, UpdateLeagueDto leagueDto)
    {
        leagueDto.Id = competitionId;
        return HandleResult(await Mediator.Send(new UpdateLeague.Command { UpdateLeagueDto = leagueDto }));
    }
    [HttpPost("{competitionId}/status")]
    [Authorize(Policy = "IsCompetitionAdmin")]
    public async Task<ActionResult> ChangeLeagueStatus(string competitionId, CompetitionStatus status, int? playerCount = null)
    {
        return HandleResult(await Mediator.Send(new ChangeLeagueStatus.Command { LeagueId = competitionId, NewStatus = status, PlayerCount = playerCount }));
    }
    [HttpDelete("{competitionId}")]
    [Authorize(Policy = "IsCompetitionAdmin")]
    public async Task<ActionResult> DeleteLeague(string competitionId)
    {
        return HandleResult(await Mediator.Send(new DeleteLeague.Command { LeagueId = competitionId }));
    }

    [HttpGet("{competitionId}/leaderboard")]
    [Authorize(Policy = "IsCompetitionMember")]
    public async Task<ActionResult> GetLeagueLeaderboard(string competitionId)
    {
        return HandleResult(await Mediator.Send(new GetLeagueLeaderboard.Query { Id = competitionId }));
    }

}
