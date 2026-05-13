using System;

namespace Domain;

public class League : Competition
{
    // Configured player count for this league (null until first activation).
    // Persisted to physical column "LeaguePlayerCount" to disjoin from Tournament.BracketSize in the TPH table.
    // Downstream consumers MUST coalesce null to 2: league.PlayerCount ?? 2.
    public int? PlayerCount { get; set; }
}
