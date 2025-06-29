using System;

namespace Application.Leagues.DTOs;

public class UpdateLeagueMemberDto : CreateLeagueMemberDto
{
    public string? Id { get; set; }
}
