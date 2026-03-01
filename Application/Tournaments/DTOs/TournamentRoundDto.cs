using System;

namespace Application.Tournaments.DTOs;

public class TournamentRoundDto
{
    public required string TournamentId { get; set; }
    public required int MatchNumber { get; set; }
    public required int RoundNumber { get; set; }
    public bool Completed { get; set; } = false;
    public string? WinnerUserId { get; set; }
    public string? PlayerOneCharacterId { get; set; }
    public string? PlayerTwoCharacterId { get; set; }
}
