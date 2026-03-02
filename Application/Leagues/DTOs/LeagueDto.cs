using System;
using Application.Matches.DTOs;
using Domain;

namespace Application.Leagues.DTOs;

public class LeagueDto
{
    public required string Id { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public CompetitionStatus Status { get; set; } = CompetitionStatus.Planned;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int BestOf { get; set; }

    // Nav properties
    public required ICollection<CompetitionMemberDto> Members { get; set; }
    public required ICollection<MatchDto> Matches { get; set; }
}
