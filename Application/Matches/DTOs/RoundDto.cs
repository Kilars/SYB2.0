using System;
using Domain;

namespace Application.Leagues.DTOs;

public class RoundDto
{
    public required string LeagueId { get; set; }
    public required int Split { get; set; }
    public required int MatchNumber { get; set; }
    public required int RoundNumber { get; set; }
    public bool Completed { get; set; } = false;
    public string? WinnerUserId { get; set; }
    public DateTime? RegisteredTime { get; set; }
    public string? PlayerOneCharacterId { get; set; }
    public string? PlayerTwoCharacterId { get; set; }
}
