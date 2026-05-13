using System;

namespace Application.Casual.DTOs;

public class CreateCasualMatchDto
{
    public required string PlayerOneUserId { get; set; }
    public required string PlayerTwoUserId { get; set; }
    public required string PlayerOneCharacterId { get; set; }
    public required string PlayerTwoCharacterId { get; set; }
    public required string WinnerUserId { get; set; }

    // Optional N>2 participant fields (shape carriers for future casual N-player support — task 045)
    public string? PlayerThreeUserId { get; set; }
    public string? PlayerFourUserId { get; set; }
    public string? SecondPlaceUserId { get; set; }
    public string? ThirdPlaceUserId { get; set; }
    public string? FourthPlaceUserId { get; set; }
    public int PlayerCount { get; set; } = 2;
}
