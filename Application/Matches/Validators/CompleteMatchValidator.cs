using System;
using Application.Matches.Commands;
using Application.Matches.DTOs;
using FluentValidation;

namespace Application.Matches.Validators;

public class CompleteMatchValidator : AbstractValidator<CompleteMatch.Command>
{
    public CompleteMatchValidator()
    {
        RuleFor(x => x.Rounds)
        // No partial fill
        .Must(rounds => !rounds.Any(r => (string.IsNullOrEmpty(r.WinnerUserId) || string.IsNullOrEmpty(r.PlayerOneCharacterId) || string.IsNullOrEmpty(r.PlayerTwoCharacterId))
            && !(string.IsNullOrEmpty(r.WinnerUserId) && string.IsNullOrEmpty(r.PlayerOneCharacterId) && string.IsNullOrEmpty(r.PlayerTwoCharacterId))))
            .WithMessage("Partially filled rounds are not allowed")
        // Enough rounds to decide the match
        .Must(rounds => rounds
            .Where(r => !string.IsNullOrEmpty(r.WinnerUserId))
            .GroupBy(r => r.WinnerUserId)
            .Select(g => g.Count())
            .DefaultIfEmpty(0)
            .Max() >= 2
        ).WithMessage("Not enough rounds played to be decisive")
        // No character reuse per player within the same match
        .Must(rounds => CharacterReuseViolation(rounds) == null)
        .WithMessage((_, rounds) => CharacterReuseViolation(rounds)!);
    }

    private static string? CharacterReuseViolation(IList<RoundDto> rounds)
    {
        var completedRounds = rounds
            .Where(r => !string.IsNullOrEmpty(r.WinnerUserId))
            .OrderBy(r => r.RoundNumber)
            .ToList();

        var playerOneUsed = new Dictionary<string, int>();
        var playerTwoUsed = new Dictionary<string, int>();

        foreach (var round in completedRounds)
        {
            if (!string.IsNullOrEmpty(round.PlayerOneCharacterId))
            {
                if (playerOneUsed.TryGetValue(round.PlayerOneCharacterId, out var p1PrevRound))
                    return $"Player 1 cannot reuse character (Round {p1PrevRound})";
                playerOneUsed[round.PlayerOneCharacterId] = round.RoundNumber;
            }

            if (!string.IsNullOrEmpty(round.PlayerTwoCharacterId))
            {
                if (playerTwoUsed.TryGetValue(round.PlayerTwoCharacterId, out var p2PrevRound))
                    return $"Player 2 cannot reuse character (Round {p2PrevRound})";
                playerTwoUsed[round.PlayerTwoCharacterId] = round.RoundNumber;
            }
        }

        return null;
    }
}
