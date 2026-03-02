using System;

namespace Application.Leagues.DTOs;

public class CreateMemberDto
{
    public required string UserId { get; set; }
    public required string DisplayName { get; set; }
}
