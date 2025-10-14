using System;
using Application.Matches.Commands;
using FluentValidation;

namespace Application.Matches.Validators;

public class CompleteMatchValidator : AbstractValidator<CompleteMatch.Command>
{
    public CompleteMatchValidator()
    {
        RuleFor(x => x.MatchId).Must(matchId =>
        {
            var compositeIdSplit = matchId.Split('_');
            try
            {
                int.Parse(compositeIdSplit[1]);
                int.Parse(compositeIdSplit[2]);
            }
            catch (Exception) { return false; }
            return compositeIdSplit.Length == 3;
        });
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
            .Max() == 2
        //Assume Bo3 for now, need atleast two matches
        ).WithMessage("Not enough rounds played to be decisive");
    }

}
