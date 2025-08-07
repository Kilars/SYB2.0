using System;
using Domain;

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
    public RoundId RoundId
    {
        get
        {
            var parts = Id.Split('_');
            return new RoundId
            {
                LeagueId = parts[0],
                Split = int.Parse(parts[1]),
                MatchIndex = int.Parse(parts[2]),
                RoundNumber = int.Parse(parts[3])
            };
        }
    }
}
