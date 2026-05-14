using Application.Leagues.Commands;
using FluentValidation;

namespace Application.Leagues.Validators;

public class ChangeLeagueStatusValidator : AbstractValidator<ChangeLeagueStatus.Command>
{
    public ChangeLeagueStatusValidator()
    {
        RuleFor(x => x.NewStatus)
            .IsInEnum().WithMessage("NewStatus must be a valid CompetitionStatus value.");

        RuleFor(x => x.PlayerCount)
            .InclusiveBetween(2, 4).WithMessage("PlayerCount must be between 2 and 4.")
            .When(x => x.PlayerCount.HasValue);
    }
}
