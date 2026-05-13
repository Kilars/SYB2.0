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

    // Per-match player count (2, 3, or 4). Default 2 (existing Bo3 matches).
    public int PlayerCount { get; set; } = 2;

    //Nav properties
    public ICollection<Round> Rounds { get; set; } = [];
    public string? PlayerOneUserId { get; set; }
    public CompetitionMember? PlayerOne { get; set; }
    public string? PlayerTwoUserId { get; set; }
    public CompetitionMember? PlayerTwo { get; set; }
    public string? PlayerThreeUserId { get; set; }
    public CompetitionMember? PlayerThree { get; set; }
    public string? PlayerFourUserId { get; set; }
    public CompetitionMember? PlayerFour { get; set; }

    // Placement columns (plain strings, not FKs — mirrors WinnerUserId pattern).
    // WinnerUserId = 1st place. SecondPlace/ThirdPlace/FourthPlace capture N>2 outcomes.
    public string? SecondPlaceUserId { get; set; }
    public string? ThirdPlaceUserId { get; set; }
    public string? FourthPlaceUserId { get; set; }

    public required string CompetitionId { get; set; }
    [JsonIgnore]
    public Competition? Competition { get; set; }
}
