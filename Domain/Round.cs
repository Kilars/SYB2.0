using System.Text.Json.Serialization;

namespace Domain;

public class Round
{
    public required int RoundNumber { get; set; }
    public bool Completed { get; set; } = false;
    public string? WinnerUserId { get; set; }
    public string? PlayerOneCharacterId { get; set; }
    public Character? PlayerOneCharacter { get; set; }
    public string? PlayerTwoCharacterId { get; set; }
    public Character? PlayerTwoCharacter { get; set; }

    //Nav properties
    public required int MatchIndex { get; set; }
    public required string LeagueId { get; set; }
    public required int Split { get; set; }
    [JsonIgnore]
    public Match? Match { get; set; }
}
public record RoundId : MatchId
{
    public required int RoundNumber { get; set; }
}
