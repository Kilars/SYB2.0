using System;
using Application.Characters.Queries;
using Domain;
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

}
