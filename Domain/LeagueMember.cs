using System;
using System.Text.Json.Serialization;

namespace Domain;

public class LeagueMember
{
    public string? UserId { get; set; }
    public User User { get; set; } = null!;
    public string? LeagueId { get; set; }
    [JsonIgnore]
    public League League { get; set; } = null!;
    public bool IsAdmin { get; set; }
    public required string DisplayName { get; set; }
    public DateTime DateJoined { get; set; } = DateTime.UtcNow;

    public ICollection<Match> MatchesAsPlayerOne = [];
    public ICollection<Match> MatchesAsPlayerTwo = [];
}
