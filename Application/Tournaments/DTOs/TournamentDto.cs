using System;
using Domain;

namespace Application.Tournaments.DTOs;

public class TournamentDto
{
    public required string Id { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public TournamentStatus Status { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int BestOf { get; set; }
    public int PlayerCount { get; set; }
    public string? WinnerUserId { get; set; }
    public required ICollection<TournamentMemberDto> Members { get; set; }
    public required ICollection<TournamentMatchDto> Matches { get; set; }
}
