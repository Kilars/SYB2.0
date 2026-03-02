using System;
using Application.Matches.DTOs;
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

    [HttpGet("{competitionId}")]
    public async Task<ActionResult<TournamentDto>> GetTournamentDetails(string competitionId)
    {
        return HandleResult(await Mediator.Send(new GetTournamentDetails.Query { Id = competitionId }));
    }

    [HttpPost]
    public async Task<ActionResult<string>> CreateTournament(CreateTournamentDto tournamentDto)
    {
        return HandleResult(await Mediator.Send(new CreateTournament.Command { TournamentDto = tournamentDto }));
    }

    [HttpDelete("{competitionId}")]
    [Authorize(Policy = "IsCompetitionAdmin")]
    public async Task<ActionResult> DeleteTournament(string competitionId)
    {
        return HandleResult(await Mediator.Send(new DeleteTournament.Command { TournamentId = competitionId }));
    }

    [HttpPost("{competitionId}/start")]
    [Authorize(Policy = "IsCompetitionAdmin")]
    public async Task<ActionResult> StartTournament(string competitionId)
    {
        return HandleResult(await Mediator.Send(new StartTournament.Command { TournamentId = competitionId }));
    }

    [HttpPost("{competitionId}/shuffle")]
    [Authorize(Policy = "IsCompetitionAdmin")]
    public async Task<ActionResult> ShuffleBracket(string competitionId)
    {
        return HandleResult(await Mediator.Send(new ShuffleBracket.Command { TournamentId = competitionId }));
    }

    [HttpGet("{competitionId}/match/{matchNumber}")]
    [Authorize(Policy = "IsCompetitionMember")]
    public async Task<ActionResult<MatchDto>> GetTournamentMatch(string competitionId, int matchNumber)
    {
        return HandleResult(await Mediator.Send(new GetTournamentMatch.Query { TournamentId = competitionId, MatchNumber = matchNumber }));
    }

    [HttpPost("{competitionId}/match/{matchNumber}/complete")]
    [Authorize(Policy = "IsCompetitionMember")]
    public async Task<ActionResult> CompleteTournamentMatch(string competitionId, int matchNumber, List<RoundDto> rounds)
    {
        return HandleResult(await Mediator.Send(new CompleteTournamentMatch.Command
        {
            TournamentId = competitionId,
            MatchNumber = matchNumber,
            Rounds = rounds
        }));
    }

    [HttpPost("{competitionId}/match/{matchNumber}/reopen")]
    [Authorize(Policy = "IsCompetitionMember")]
    public async Task<ActionResult> ReopenTournamentMatch(string competitionId, int matchNumber)
    {
        return HandleResult(await Mediator.Send(new ReopenTournamentMatch.Command
        {
            TournamentId = competitionId,
            MatchNumber = matchNumber
        }));
    }
}
