using Application.Guests.Commands;
using FluentValidation;

namespace Application.Guests.Validators;

public class CreateGuestValidator : AbstractValidator<CreateGuest.Command>
{
    public CreateGuestValidator()
    {
        RuleFor(x => x.DisplayName)
            .NotEmpty().WithMessage("Display name is required")
            .MaximumLength(50).WithMessage("Display name cannot exceed 50 characters");
    }
}
