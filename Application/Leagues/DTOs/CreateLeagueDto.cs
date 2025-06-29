using System;

namespace Application.Leagues.DTOs;

public class CreateLeagueDto
{
    public required string Title { get; set; }
    public required string Description { get; set; }
    public DateTime StartDate { get; set; }
    public List<CreateLeagueMemberDto> Members { get; set; } = [];
}
