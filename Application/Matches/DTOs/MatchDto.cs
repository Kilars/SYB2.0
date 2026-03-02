using System;
using Application.Leagues.DTOs;

namespace Application.Matches.DTOs;

public class MatchDto
{
    public bool Completed { get; set; }
    public required string CompetitionId { get; set; }
    public int BracketNumber { get; set; }
    public int MatchNumber { get; set; }
    public string? WinnerUserId { get; set; }
    public DateTime? RegisteredTime { get; set; }

    public CompetitionMemberDto? PlayerOne { get; set; }
    public CompetitionMemberDto? PlayerTwo { get; set; }
    public required ICollection<RoundDto> Rounds { get; set; }
}
