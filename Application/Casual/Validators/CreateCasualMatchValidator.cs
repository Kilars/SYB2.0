using System;
using Application.Casual.Commands;
using FluentValidation;

namespace Application.Casual.Validators;

public class CreateCasualMatchValidator : AbstractValidator<CreateCasualMatch.Command>
{
    public CreateCasualMatchValidator()
    {
        RuleFor(x => x.CasualMatchDto.PlayerCount)
            .InclusiveBetween(2, 4)
            .WithMessage("Player count must be 2, 3, or 4");

        RuleFor(x => x.CasualMatchDto.PlayerOneUserId)
            .NotEmpty().WithMessage("Player one is required");
        RuleFor(x => x.CasualMatchDto.PlayerTwoUserId)
            .NotEmpty().WithMessage("Player two is required");

        // PlayerThreeUserId required when PlayerCount >= 3
        RuleFor(x => x.CasualMatchDto.PlayerThreeUserId)
            .NotEmpty().WithMessage("Player three is required for 3+ player matches")
            .When(x => x.CasualMatchDto.PlayerCount >= 3);

        // PlayerFourUserId required when PlayerCount >= 4
        RuleFor(x => x.CasualMatchDto.PlayerFourUserId)
            .NotEmpty().WithMessage("Player four is required for 4-player matches")
            .When(x => x.CasualMatchDto.PlayerCount >= 4);

        // Exactly PlayerCount participants must be provided (non-null slots)
        RuleFor(x => x.CasualMatchDto)
            .Must(dto =>
            {
                var participants = new[] { dto.PlayerOneUserId, dto.PlayerTwoUserId, dto.PlayerThreeUserId, dto.PlayerFourUserId };
                var nonNull = Array.FindAll(participants, p => !string.IsNullOrEmpty(p));
                return nonNull.Length == dto.PlayerCount;
            })
            .WithMessage("Number of participants must exactly match PlayerCount");

        // All participant IDs must be distinct
        RuleFor(x => x.CasualMatchDto)
            .Must(dto =>
            {
                var ids = new[] { dto.PlayerOneUserId, dto.PlayerTwoUserId, dto.PlayerThreeUserId, dto.PlayerFourUserId };
                var nonNull = Array.FindAll(ids, p => !string.IsNullOrEmpty(p));
                return nonNull.Length == new System.Collections.Generic.HashSet<string>(nonNull).Count;
            })
            .WithMessage("All player IDs must be distinct");

        // WinnerUserId is required and must be one of the participants
        RuleFor(x => x.CasualMatchDto.WinnerUserId)
            .NotEmpty().WithMessage("Winner is required");

        RuleFor(x => x.CasualMatchDto)
            .Must(dto =>
            {
                if (string.IsNullOrEmpty(dto.WinnerUserId)) return true; // let the NotEmpty rule fire
                var participants = new[] { dto.PlayerOneUserId, dto.PlayerTwoUserId, dto.PlayerThreeUserId, dto.PlayerFourUserId };
                return Array.Exists(participants, p => p == dto.WinnerUserId);
            })
            .WithMessage("Winner must be one of the participants");

        // Placement rules: placements must be from the participant set and have no holes
        RuleFor(x => x.CasualMatchDto)
            .Must(dto =>
            {
                // No holes: if ThirdPlaceUserId is set, SecondPlaceUserId must be set
                if (!string.IsNullOrEmpty(dto.ThirdPlaceUserId) && string.IsNullOrEmpty(dto.SecondPlaceUserId))
                    return false;
                // No holes: if FourthPlaceUserId is set, ThirdPlaceUserId must be set
                if (!string.IsNullOrEmpty(dto.FourthPlaceUserId) && string.IsNullOrEmpty(dto.ThirdPlaceUserId))
                    return false;
                return true;
            })
            .WithMessage("Placement positions must not have gaps (e.g., cannot set 3rd without 2nd)");

        RuleFor(x => x.CasualMatchDto)
            .Must(dto =>
            {
                // All set placement userIds must be in the participant set
                var participants = new System.Collections.Generic.HashSet<string>(
                    System.Linq.Enumerable.Where(
                        new[] { dto.PlayerOneUserId, dto.PlayerTwoUserId, dto.PlayerThreeUserId, dto.PlayerFourUserId },
                        p => !string.IsNullOrEmpty(p))!);
                foreach (var placement in new[] { dto.SecondPlaceUserId, dto.ThirdPlaceUserId, dto.FourthPlaceUserId })
                {
                    if (!string.IsNullOrEmpty(placement) && !participants.Contains(placement))
                        return false;
                }
                return true;
            })
            .WithMessage("All placements must reference a participant in this match");

        RuleFor(x => x.CasualMatchDto)
            .Must(dto =>
            {
                // No duplicate placements
                var placements = System.Linq.Enumerable.Where(
                    new[] { dto.WinnerUserId, dto.SecondPlaceUserId, dto.ThirdPlaceUserId, dto.FourthPlaceUserId },
                    p => !string.IsNullOrEmpty(p)).ToList();
                return placements.Count == new System.Collections.Generic.HashSet<string>(placements).Count;
            })
            .WithMessage("Placement positions must not have duplicate players");

        // N=2: PlayerOne/Two characters are required; PlayerThree/Four character fields must be null
        RuleFor(x => x.CasualMatchDto.PlayerOneCharacterId)
            .NotEmpty().WithMessage("Player one character is required for 1v1 matches")
            .When(x => x.CasualMatchDto.PlayerCount == 2);

        RuleFor(x => x.CasualMatchDto.PlayerTwoCharacterId)
            .NotEmpty().WithMessage("Player two character is required for 1v1 matches")
            .When(x => x.CasualMatchDto.PlayerCount == 2);

        RuleFor(x => x.CasualMatchDto.PlayerThreeCharacterId)
            .Null().WithMessage("PlayerThreeCharacterId must be null for 1v1 matches")
            .When(x => x.CasualMatchDto.PlayerCount == 2);

        RuleFor(x => x.CasualMatchDto.PlayerFourCharacterId)
            .Null().WithMessage("PlayerFourCharacterId must be null for 1v1 matches")
            .When(x => x.CasualMatchDto.PlayerCount == 2);

        // N>2: all character fields optional (no validation needed beyond null-safety)
    }
}
