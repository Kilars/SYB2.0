using System;

namespace Domain;

public class LeaderboardUser
{
    public required int Wins { get; set; }
    public required int Losses { get; set; }
    public required int Flawless { get; set; }
    public required int Points { get; set; }
    public required string DisplayName { get; set; }
    public string? UserId { get; set; }
    public bool IsGuest { get; set; }
    public int FirstPlaceCount { get; set; }
    public int SecondPlaceCount { get; set; }
    public int ThirdPlaceCount { get; set; }
    public int FourthPlaceCount { get; set; }
}
