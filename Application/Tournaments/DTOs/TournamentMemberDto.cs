using System;

namespace Application.Tournaments.DTOs;

public class TournamentMemberDto
{
    public required string TournamentId { get; set; }
    public required string UserId { get; set; }
    public bool IsAdmin { get; set; }
    public int Seed { get; set; }
    public required string DisplayName { get; set; }
    public DateTime DateJoined { get; set; }
    public bool IsGuest { get; set; }
}
