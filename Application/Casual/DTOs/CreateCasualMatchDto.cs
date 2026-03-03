using System;

namespace Application.Casual.DTOs;

public class CreateCasualMatchDto
{
    public required string PlayerOneUserId { get; set; }
    public required string PlayerTwoUserId { get; set; }
    public required string PlayerOneCharacterId { get; set; }
    public required string PlayerTwoCharacterId { get; set; }
    public required string WinnerUserId { get; set; }
}
