using System;
using Application.Leagues.Commands;
using FluentValidation;

namespace Application.Leagues.Validators;

public class CreateLeagueValidator : AbstractValidator<CreateLeague.Command>
{
    public CreateLeagueValidator()
    {
        RuleFor(x => x.LeagueDto.Title)
            .NotEmpty().WithMessage("Title is required")
            .MaximumLength(100).WithMessage("Title cannot exceed 100 characters");
        RuleFor(x => x.LeagueDto.Description)
            .NotEmpty().WithMessage("Description is required");
        RuleFor(x => x.LeagueDto.BestOf)
            .Must(x => x == 1 || x == 3 || x == 5)
            .WithMessage("Best of must be 1, 3, or 5");
    }

}
