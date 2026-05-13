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
    public int PlayerCount { get; set; }

    public CompetitionMemberDto? PlayerOne { get; set; }
    public CompetitionMemberDto? PlayerTwo { get; set; }
    public CompetitionMemberDto? PlayerThree { get; set; }
    public CompetitionMemberDto? PlayerFour { get; set; }

    // Participant userIds (plain strings, no nav — mirrors WinnerUserId pattern)
    public string? PlayerThreeUserId { get; set; }
    public string? PlayerFourUserId { get; set; }

    // Placement columns (plain strings, not FKs)
    public string? SecondPlaceUserId { get; set; }
    public string? ThirdPlaceUserId { get; set; }
    public string? FourthPlaceUserId { get; set; }

    public required ICollection<RoundDto> Rounds { get; set; }
}
