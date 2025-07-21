using System;
using Domain;

namespace Application.Leagues.DTOs;

public class LeagueDto
{
    public required string Id { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public LeagueStatus Status { get; set; } = LeagueStatus.Planned;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    // Nav properties
    public required ICollection<LeagueMemberDto> Members { get; set; }
    public required ICollection<MatchDto> Matches { get; set; }

}
