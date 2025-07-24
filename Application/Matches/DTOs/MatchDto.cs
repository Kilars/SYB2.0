using System;
using Domain;

namespace Application.Leagues.DTOs;

public class MatchDto
{
    public required string Id { get; set; }
    public bool Completed { get; set; }
    public int Split { get; set; }
    public int MatchIndex { get; set; }
    public string? WinnerUserId { get; set; }
    public DateTime? RegisteredTime { get; set; }

    public LeagueMemberDto? PlayerOne { get; set; }
    public LeagueMemberDto? PlayerTwo { get; set; }
    public required ICollection<RoundDto> Rounds { get; set; }
}
