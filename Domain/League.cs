using System;

namespace Domain;

public enum LeagueStatus
{
    Planned,
    Active,
    Complete
}
public class League
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public required string Title { get; set; }
    public required string Description { get; set; }
    public LeagueStatus Status { get; set; } = LeagueStatus.Planned;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    // Nav properties
    public ICollection<LeagueMember> Members { get; set; } = [];
    public ICollection<Match> Matches { get; set; } = [];
}
