using System;
using Application.Characters.Queries;
using Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class CharactersController : BaseApiController
{
    [HttpGet]
    [Route("")]
    public async Task<ActionResult<List<Character>>> GetCharacters()
    {
        return HandleResult(await Mediator.Send(new GetCharacterList.Query()));
    }

    [Authorize]
    [HttpGet("user/{userId}/top")]
    public async Task<ActionResult<List<string>>> GetUserTopCharacters(string userId, [FromQuery] int? count)
    {
        return HandleResult(await Mediator.Send(new GetUserTopCharacters.Query
        {
            UserId = userId,
            Count = count ?? 5
        }));
    }
}
