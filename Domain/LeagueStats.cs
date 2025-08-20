using System;

namespace Domain;

public class LeagueStats
{
    public required List<CharacterStats> CharacterStats { get; set; }
    public double FirstPickAdvantage { get; set; }
}

public class StatUnit
{
    public string Name { get; set; } = "";
    public int Games { get; set; }
    public int Wins { get; set; }
    public int Losses { get; set; }
}

public class CharacterStats : StatUnit {
    public string? CharacterId { get; set; }
    public Character? Character { get; set; }
}
