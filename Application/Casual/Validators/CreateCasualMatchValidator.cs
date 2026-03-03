using System;
using Application.Casual.Commands;
using FluentValidation;

namespace Application.Casual.Validators;

public class CreateCasualMatchValidator : AbstractValidator<CreateCasualMatch.Command>
{
    public CreateCasualMatchValidator()
    {
        RuleFor(x => x.CasualMatchDto.PlayerOneUserId)
            .NotEmpty().WithMessage("Player one is required");
        RuleFor(x => x.CasualMatchDto.PlayerTwoUserId)
            .NotEmpty().WithMessage("Player two is required");
        RuleFor(x => x.CasualMatchDto.PlayerOneCharacterId)
            .NotEmpty().WithMessage("Player one character is required");
        RuleFor(x => x.CasualMatchDto.PlayerTwoCharacterId)
            .NotEmpty().WithMessage("Player two character is required");
        RuleFor(x => x.CasualMatchDto.WinnerUserId)
            .NotEmpty().WithMessage("Winner is required");
        RuleFor(x => x.CasualMatchDto)
            .Must(dto => dto.PlayerOneUserId != dto.PlayerTwoUserId)
            .WithMessage("Players must be different");
        RuleFor(x => x.CasualMatchDto)
            .Must(dto => dto.WinnerUserId == dto.PlayerOneUserId || dto.WinnerUserId == dto.PlayerTwoUserId)
            .WithMessage("Winner must be one of the players");
    }
}
