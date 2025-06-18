using System;
using System.Diagnostics;
using System.Threading.Tasks;
using Application.Leagues.Queries;
using Domain;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace API.Controllers;

public class LeaguesController() : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<List<League>>> GetLeagues()
    {
        return await Mediator.Send(new GetLeagueList.Query());
    }
    [HttpGet("{id}")]
    public async Task<ActionResult<League>> GetLeagueDetails(string id)
    {
        return await Mediator.Send(new GetLeagueDetails.Query{Id = id});
    }

}
