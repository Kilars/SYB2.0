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
        return await Mediator.Send(new GetLeagueList.Query());
    }
    [HttpGet("{id}")]
    public async Task<ActionResult<LeagueDto>> GetLeagueDetails(string id)
    {
        return await Mediator.Send(new GetLeagueDetails.Query { Id = id });
    }

    [HttpPost]
    public async Task<ActionResult<string>> CreateLeague(CreateLeagueDto leagueDto)
    {
        return await Mediator.Send(new CreateLeague.Command { LeagueDto = leagueDto });
    }
    [HttpPut]
    public async Task<ActionResult> UpdateLeague(UpdateLeagueDto leagueDto)
    {
        return Ok(await Mediator.Send(new UpdateLeague.Command { UpdateLeagueDto = leagueDto }));
    }

}
