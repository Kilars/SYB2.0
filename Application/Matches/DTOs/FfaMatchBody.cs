namespace Application.Matches.DTOs;

public class FfaMatchBody
{
    public required string WinnerUserId { get; set; }
    public string? SecondPlaceUserId { get; set; }
    public string? ThirdPlaceUserId { get; set; }
    public string? FourthPlaceUserId { get; set; }
}
