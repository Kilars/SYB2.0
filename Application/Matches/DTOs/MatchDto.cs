using System;
using Domain;

namespace Application.Leagues.DTOs;

public class MatchDto
{
    public bool Completed { get; set; }
    public required string LeagueId { get; set; }
    public int Split { get; set; }
    public int MatchNumber { get; set; }
    public string? WinnerUserId { get; set; }
    public DateTime? RegisteredTime { get; set; }

    public LeagueMemberDto? PlayerOne { get; set; }
    public LeagueMemberDto? PlayerTwo { get; set; }
    public required ICollection<RoundDto> Rounds { get; set; }
}
