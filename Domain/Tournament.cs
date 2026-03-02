using System;

namespace Domain;

public class Tournament : Competition
{
    public int PlayerCount { get; set; }
    public string? WinnerUserId { get; set; }
}
