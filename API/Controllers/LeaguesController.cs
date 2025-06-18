using System;
using System.Threading.Tasks;
using Domain;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace API.Controllers;

public class LeaguesController(AppDbContext context) : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<List<League>>> GetLeagues()
    {
        var leagues = await context.Leagues.ToListAsync();

        return Ok(leagues);
    }

}
