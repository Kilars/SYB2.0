using Application.Matches.Commands;
using FluentValidation;

namespace Application.Matches.Validators;

public class CompleteFfaMatchValidator : AbstractValidator<CompleteFfaMatch.Command>
{
    public CompleteFfaMatchValidator()
    {
        RuleFor(x => x.WinnerUserId)
            .NotEmpty().WithMessage("WinnerUserId is required.");

        RuleFor(x => x)
            .Must(PlacementsAreDistinct)
            .WithMessage("Placement userIds must be distinct.")
            .When(cmd => !string.IsNullOrEmpty(cmd.WinnerUserId));
    }

    private static bool PlacementsAreDistinct(CompleteFfaMatch.Command cmd)
    {
        var placements = new[] { cmd.WinnerUserId, cmd.SecondPlaceUserId, cmd.ThirdPlaceUserId, cmd.FourthPlaceUserId }
            .Where(p => !string.IsNullOrEmpty(p))
            .ToList();
        return placements.Count == placements.Distinct(StringComparer.Ordinal).Count();
    }
}
