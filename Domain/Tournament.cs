using System;

namespace Domain;

public class Tournament : Competition
{
    // Total bracket size (4, 8, 16, 32 for N=2 brackets, etc.).
    // Renamed from PlayerCount to avoid cognitive collision with Match.PlayerCount (per-heat N).
    // Persisted to physical column "BracketSize" via explicit HasColumnName in AppDbContext.
    public int BracketSize { get; set; }
    public string? WinnerUserId { get; set; }
}
