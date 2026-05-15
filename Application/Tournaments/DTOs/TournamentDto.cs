using System;
using Application.Leagues.DTOs;
using Application.Matches.DTOs;
using Domain;

namespace Application.Tournaments.DTOs;

public class TournamentDto
{
    public required string Id { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public CompetitionStatus Status { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int BestOf { get; set; }
    public int BracketSize { get; set; }
    public int PerHeatPlayerCount { get; set; }
    public string? WinnerUserId { get; set; }
    public required ICollection<CompetitionMemberDto> Members { get; set; }
    public required ICollection<MatchDto> Matches { get; set; }
}
