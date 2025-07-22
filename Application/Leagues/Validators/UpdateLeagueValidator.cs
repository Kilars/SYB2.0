using System;
using Application.Leagues.Commands;
using FluentValidation;

namespace Application.Leagues.Validators;

public class UpdateLeagueValidator : AbstractValidator<UpdateLeague.Command>
{
    public UpdateLeagueValidator()
    {
        RuleFor(x => x.UpdateLeagueDto.Id)
            .NotEmpty().WithMessage("LeagueId is required");
        RuleFor(x => x.UpdateLeagueDto.Title)
            .NotEmpty().WithMessage("Title is required")
            .MaximumLength(100).WithMessage("Title cannot exceed 100 characters");
        RuleFor(x => x.UpdateLeagueDto.Description)
            .NotEmpty().WithMessage("Description is required");
    }

}
