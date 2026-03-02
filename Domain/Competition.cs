using System;

namespace Domain;

public enum CompetitionStatus
{
    Planned = 0,
    Active = 1,
    Complete = 2,
}

public abstract class Competition
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public required string Title { get; set; }
    public required string Description { get; set; }
    public CompetitionStatus Status { get; set; } = CompetitionStatus.Planned;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int BestOf { get; set; } = 3;

    // Nav properties
    public ICollection<CompetitionMember> Members { get; set; } = [];
    public ICollection<Match> Matches { get; set; } = [];
}
