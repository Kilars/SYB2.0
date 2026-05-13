using System.Text.Json.Serialization;

namespace Domain;

/// <summary>
/// Represents a single game round within a match.
/// For N=2 matches (Bo3): up to 3 Round rows (RoundNumber 1..3).
/// For N&gt;2 matches (single-round): exactly 1 Round row (RoundNumber=1).
/// Enforcement of the single-round contract lives in the handlers (tasks 044/045/046).
/// </summary>
public class Round
{
    public required int RoundNumber { get; set; }
    public bool Completed { get; set; } = false;
    public string? WinnerUserId { get; set; }
    public string? PlayerOneCharacterId { get; set; }
    public Character? PlayerOneCharacter { get; set; }
    public string? PlayerTwoCharacterId { get; set; }
    public Character? PlayerTwoCharacter { get; set; }
    // Character selections for N>2 matches. Character.Id is string (not int).
    public string? PlayerThreeCharacterId { get; set; }
    public Character? PlayerThreeCharacter { get; set; }
    public string? PlayerFourCharacterId { get; set; }
    public Character? PlayerFourCharacter { get; set; }

    //Nav properties
    public required int MatchNumber { get; set; }
    public required string CompetitionId { get; set; }
    public required int BracketNumber { get; set; }
    [JsonIgnore]
    public Match? Match { get; set; }
}
