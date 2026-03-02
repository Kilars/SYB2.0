using System;

namespace Application.Matches.DTOs;

public class RoundDto
{
    public required string CompetitionId { get; set; }
    public required int BracketNumber { get; set; }
    public required int MatchNumber { get; set; }
    public required int RoundNumber { get; set; }
    public bool Completed { get; set; } = false;
    public string? WinnerUserId { get; set; }
    public DateTime? RegisteredTime { get; set; }
    public string? PlayerOneCharacterId { get; set; }
    public string? PlayerTwoCharacterId { get; set; }
}
