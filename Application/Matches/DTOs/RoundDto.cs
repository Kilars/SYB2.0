using System;

namespace Application.Leagues.DTOs;

public class RoundDto
{
    public required string Id { get; set; }
    public required int RoundNumber { get; set; }
    public bool Completed { get; set; } = false;
    public string? WinnerUserId { get; set; }
    public DateTime? RegisteredTime { get; set; }
    public string? PlayerOneCharacterId { get; set; }
    public string? PlayerTwoCharacterId { get; set; }
}
