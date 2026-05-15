using System;

namespace Application.Casual.DTOs;

public class CreateCasualMatchDto
{
    // PlayerCount: 2 (1v1 Bo3) | 3 (3-FFA Single) | 4 (4-FFA Single). Default 2.
    public int PlayerCount { get; set; } = 2;

    public required string PlayerOneUserId { get; set; }
    public required string PlayerTwoUserId { get; set; }
    public string? PlayerThreeUserId { get; set; }
    public string? PlayerFourUserId { get; set; }

    public required string WinnerUserId { get; set; }

    // Placement columns: 2nd/3rd/4th optional; WinnerUserId is 1st place.
    public string? SecondPlaceUserId { get; set; }
    public string? ThirdPlaceUserId { get; set; }
    public string? FourthPlaceUserId { get; set; }

    // Character selections: string FK matching Character.Id.
    // N=2: PlayerOne/Two required. N>2: all optional.
    public string? PlayerOneCharacterId { get; set; }
    public string? PlayerTwoCharacterId { get; set; }
    public string? PlayerThreeCharacterId { get; set; }
    public string? PlayerFourCharacterId { get; set; }
}
