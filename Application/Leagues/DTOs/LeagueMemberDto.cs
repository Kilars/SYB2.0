using System;

namespace Application.Leagues.DTOs;

public class CompetitionMemberDto
{
    public required string CompetitionId { get; set; }
    public required string UserId { get; set; }
    public bool IsAdmin { get; set; }
    public required string DisplayName { get; set; }
    public DateTime DateJoined { get; set; }
    public bool IsGuest { get; set; }
    public int? Seed { get; set; }
}
