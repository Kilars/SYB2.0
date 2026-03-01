using System;

namespace Domain;

public enum TournamentStatus
{
    Planned = 0,
    Active = 1,
    Complete = 2,
}

public class Tournament
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public required string Title { get; set; }
    public required string Description { get; set; }
    public TournamentStatus Status { get; set; } = TournamentStatus.Planned;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int BestOf { get; set; } = 3; // 1, 3, or 5
    public int PlayerCount { get; set; } // 4, 8, 16, 32
    public string? WinnerUserId { get; set; }

    // Nav properties
    public ICollection<TournamentMember> Members { get; set; } = [];
    public ICollection<TournamentMatch> Matches { get; set; } = [];
}
