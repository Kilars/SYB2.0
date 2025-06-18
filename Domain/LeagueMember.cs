using System;
using System.Text.Json.Serialization;

namespace Domain;

public class LeagueMember
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public required string DisplayName { get; set; }
    public string? LeagueId { get; set; }
    [JsonIgnore]
    public League League { get; set; } = null!;
    public DateTime DateJoined { get; set; } = DateTime.UtcNow;
    public bool IsAdmin { get; set; }
}
