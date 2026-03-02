using System;
using System.Text.Json.Serialization;

namespace Domain;

public class CompetitionMember
{
    public string? UserId { get; set; }
    public User User { get; set; } = null!;
    public string? CompetitionId { get; set; }
    [JsonIgnore]
    public Competition Competition { get; set; } = null!;
    public bool IsAdmin { get; set; }
    public int? Seed { get; set; }
    public DateTime DateJoined { get; set; } = DateTime.UtcNow;

    public ICollection<Match> MatchesAsPlayerOne = [];
    public ICollection<Match> MatchesAsPlayerTwo = [];
}
