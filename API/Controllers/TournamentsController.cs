using System;
using Application.Tournaments.Commands;
using Application.Tournaments.DTOs;
using Application.Tournaments.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class TournamentsController() : BaseApiController
{
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<List<TournamentDto>>> GetTournaments()
    {
        return HandleResult(await Mediator.Send(new GetTournamentList.Query()));
    }

    [HttpGet("{tournamentId}")]
    public async Task<ActionResult<TournamentDto>> GetTournamentDetails(string tournamentId)
    {
        return HandleResult(await Mediator.Send(new GetTournamentDetails.Query { Id = tournamentId }));
    }

    [HttpPost]
    public async Task<ActionResult<string>> CreateTournament(CreateTournamentDto tournamentDto)
    {
        return HandleResult(await Mediator.Send(new CreateTournament.Command { TournamentDto = tournamentDto }));
    }

    [HttpDelete("{tournamentId}")]
    [Authorize(Policy = "IsTournamentAdmin")]
    public async Task<ActionResult> DeleteTournament(string tournamentId)
    {
        return HandleResult(await Mediator.Send(new DeleteTournament.Command { TournamentId = tournamentId }));
    }

    [HttpPost("{tournamentId}/start")]
    [Authorize(Policy = "IsTournamentAdmin")]
    public async Task<ActionResult> StartTournament(string tournamentId)
    {
        return HandleResult(await Mediator.Send(new StartTournament.Command { TournamentId = tournamentId }));
    }

    [HttpPost("{tournamentId}/shuffle")]
    [Authorize(Policy = "IsTournamentAdmin")]
    public async Task<ActionResult> ShuffleBracket(string tournamentId)
    {
        return HandleResult(await Mediator.Send(new ShuffleBracket.Command { TournamentId = tournamentId }));
    }

    [HttpGet("{tournamentId}/match/{matchNumber}")]
    [Authorize(Policy = "IsTournamentMember")]
    public async Task<ActionResult<TournamentMatchDto>> GetTournamentMatch(string tournamentId, int matchNumber)
    {
        return HandleResult(await Mediator.Send(new GetTournamentMatch.Query { TournamentId = tournamentId, MatchNumber = matchNumber }));
    }

    [HttpPost("{tournamentId}/match/{matchNumber}/complete")]
    [Authorize(Policy = "IsTournamentMember")]
    public async Task<ActionResult> CompleteTournamentMatch(string tournamentId, int matchNumber, List<TournamentRoundDto> rounds)
    {
        return HandleResult(await Mediator.Send(new CompleteTournamentMatch.Command
        {
            TournamentId = tournamentId,
            MatchNumber = matchNumber,
            Rounds = rounds
        }));
    }

    [HttpPost("{tournamentId}/match/{matchNumber}/reopen")]
    [Authorize(Policy = "IsTournamentMember")]
    public async Task<ActionResult> ReopenTournamentMatch(string tournamentId, int matchNumber)
    {
        return HandleResult(await Mediator.Send(new ReopenTournamentMatch.Command
        {
            TournamentId = tournamentId,
            MatchNumber = matchNumber
        }));
    }
}
