using System;
using System.Text.Json.Serialization;

namespace Domain;

public class Match
{
    public bool Completed { get; set; } = false;
    public int BracketNumber { get; set; } = 1;
    public int MatchNumber { get; set; } = 0;
    public string? WinnerUserId { get; set; }
    public DateTime? RegisteredTime { get; set; }

    //Nav properties
    public ICollection<Round> Rounds { get; set; } = [];
    public string? PlayerOneUserId { get; set; }
    public CompetitionMember? PlayerOne { get; set; }
    public string? PlayerTwoUserId { get; set; }
    public CompetitionMember? PlayerTwo { get; set; }
    public required string CompetitionId { get; set; }
    [JsonIgnore]
    public Competition? Competition { get; set; }
}
