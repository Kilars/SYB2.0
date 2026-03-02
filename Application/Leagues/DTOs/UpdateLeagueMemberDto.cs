using System;

namespace Application.Leagues.DTOs;

public class UpdateLeagueMemberDto : CreateMemberDto
{
    public string? Id { get; set; }
}
