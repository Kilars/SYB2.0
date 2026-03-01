using System;
using System.Text.Json.Serialization;

namespace Domain;

public class TournamentMatch
{
    public bool Completed { get; set; } = false;
    public int BracketRound { get; set; } // 1 = first round, 2 = quarterfinals, etc.
    public int BracketPosition { get; set; } // Position within the round (1-based)
    public int MatchNumber { get; set; } // Global match number for the tournament
    public string? WinnerUserId { get; set; }
    public DateTime? RegisteredTime { get; set; }

    // Nav properties
    public ICollection<TournamentRound> Rounds { get; set; } = [];
    public string? PlayerOneUserId { get; set; }
    public TournamentMember? PlayerOne { get; set; }
    public string? PlayerTwoUserId { get; set; }
    public TournamentMember? PlayerTwo { get; set; }
    public required string TournamentId { get; set; }
    [JsonIgnore]
    public Tournament? Tournament { get; set; }
}
