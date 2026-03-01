using Application.Guests.Commands;
using FluentValidation;

namespace Application.Guests.Validators;

public class MergeGuestValidator : AbstractValidator<MergeGuest.Command>
{
    public MergeGuestValidator()
    {
        RuleFor(x => x.GuestUserId)
            .NotEmpty().WithMessage("Guest user ID is required");
        RuleFor(x => x.TargetUserId)
            .NotEmpty().WithMessage("Target user ID is required");
        RuleFor(x => x)
            .Must(x => x.GuestUserId != x.TargetUserId)
            .WithMessage("Guest and target user IDs must be different");
    }
}
