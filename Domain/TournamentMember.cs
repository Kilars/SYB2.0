using System;
using System.Text.Json.Serialization;

namespace Domain;

public class TournamentMember
{
    public string? UserId { get; set; }
    public User User { get; set; } = null!;
    public string? TournamentId { get; set; }
    [JsonIgnore]
    public Tournament Tournament { get; set; } = null!;
    public bool IsAdmin { get; set; }
    public int Seed { get; set; } // Bracket seed position (1-based)
    public DateTime DateJoined { get; set; } = DateTime.UtcNow;
}
