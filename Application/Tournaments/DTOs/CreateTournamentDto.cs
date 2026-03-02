using System;
using Application.Leagues.DTOs;

namespace Application.Tournaments.DTOs;

public class CreateTournamentDto
{
    public required string Title { get; set; }
    public required string Description { get; set; }
    public DateTime StartDate { get; set; }
    public int BestOf { get; set; } = 3;
    public List<CreateMemberDto> Members { get; set; } = [];
}
