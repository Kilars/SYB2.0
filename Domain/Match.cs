using System;

namespace Domain;

public class Match
{
    public bool Completed { get; set; } = false;
    public int Split = 1;
    public int MatchIndex = 0;
    public string? WinnerId { get; set; }
    public DateTime? RegisteredTime { get; set; }

    //Nav properties
    public ICollection<Round> Rounds { get; set; } = [];
    public required string PlayerOneUserId { get; set; }
    public required string PlayerOneLeagueId { get; set; }
    public LeagueMember? PlayerOne { get; set; }
    public required string PlayerTwoUserId { get; set; }
    public required string PlayerTwoLeagueId { get; set; }
    public LeagueMember? PlayerTwo { get; set; }
    public required string LeagueId { get; set; }
    public League? League { get; set; }

}
