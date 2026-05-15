using System;

namespace Domain;

public class Tournament : Competition
{
    // Total bracket size (4, 8, 16, 32 for N=2 brackets, etc.).
    // Renamed from PlayerCount to avoid cognitive collision with Match.PlayerCount (per-heat N).
    // Persisted to physical column "BracketSize" via explicit HasColumnName in AppDbContext.
    public int BracketSize { get; set; }

    // Per-heat player count (2, 3, or 4). Persisted at CreateTournament so
    // Planned-status views render correctly before StartTournament locks BracketSize.
    // NOT NULL DEFAULT 2 at the DB level (existing rows backfill to 2).
    public int PerHeatPlayerCount { get; set; } = 2;

    public string? WinnerUserId { get; set; }
}
