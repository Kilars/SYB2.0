using System;

namespace Application.Tournaments.DTOs;

public class TournamentMatchDto
{
    public bool Completed { get; set; }
    public required string TournamentId { get; set; }
    public int BracketRound { get; set; }
    public int BracketPosition { get; set; }
    public int MatchNumber { get; set; }
    public string? WinnerUserId { get; set; }
    public DateTime? RegisteredTime { get; set; }
    public TournamentMemberDto? PlayerOne { get; set; }
    public TournamentMemberDto? PlayerTwo { get; set; }
    public required ICollection<TournamentRoundDto> Rounds { get; set; }
}
