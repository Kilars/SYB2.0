using System;

namespace Application.Leagues.DTOs;

public class CreateLeagueMemberDto
{
    public required string UserId { get; set; }
    public required string DisplayName { get; set; }
}
