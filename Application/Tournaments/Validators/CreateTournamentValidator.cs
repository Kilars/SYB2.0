using System;
using Application.Tournaments.Commands;
using FluentValidation;

namespace Application.Tournaments.Validators;

public class CreateTournamentValidator : AbstractValidator<CreateTournament.Command>
{
    public CreateTournamentValidator()
    {
        RuleFor(x => x.TournamentDto.Title)
            .NotEmpty().WithMessage("Title is required")
            .MaximumLength(100).WithMessage("Title cannot exceed 100 characters");
        RuleFor(x => x.TournamentDto.Description)
            .NotEmpty().WithMessage("Description is required");
        RuleFor(x => x.TournamentDto.BestOf)
            .Must(x => x == 1 || x == 3 || x == 5)
            .WithMessage("Best of must be 1, 3, or 5");
        RuleFor(x => x.TournamentDto.PerHeatPlayerCount)
            .Must(x => x == 2 || x == 3 || x == 4)
            .WithMessage("Per-heat player count must be 2, 3, or 4");
        RuleFor(x => x.TournamentDto)
            .Must(dto => dto.PerHeatPlayerCount <= 2 || dto.BestOf == 1)
            .WithMessage("Best of must be 1 when per-heat player count is greater than 2");
    }
}
