using System;

namespace Application.Leagues.DTOs;

public class UpdateLeagueDto : CreateLeagueDto
{
    public required string Id { get; set; }
    new public required ICollection<UpdateLeagueMemberDto> Members { get; set; }
}
