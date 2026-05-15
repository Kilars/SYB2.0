using System;
using Application.Matches.DTOs;
using Application.Tournaments.Commands;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Tournaments.Validators;

public class CompleteTournamentMatchValidator : AbstractValidator<CompleteTournamentMatch.Command>
{
    private readonly AppDbContext _context;

    public CompleteTournamentMatchValidator(AppDbContext context)
    {
        _context = context;

        // Branch rules on match.PlayerCount (fetched async from DB).
        // N=2 Bo3: character-reuse and decisive-round rules.
        // N>2 single-round: exactly one round, WinnerUserId required, N=4 requires SecondPlaceUserId.
        RuleFor(x => x)
            .MustAsync(ValidateForMatchTypeAsync)
            .WithMessage("Invalid match completion data");
    }

    private async Task<bool> ValidateForMatchTypeAsync(
        CompleteTournamentMatch.Command command,
        CancellationToken cancellationToken)
    {
        var match = await _context.Matches
            .AsNoTracking()
            .FirstOrDefaultAsync(m =>
                m.CompetitionId == command.TournamentId && m.MatchNumber == command.MatchNumber,
                cancellationToken);

        if (match == null) return true; // Handler returns 404 — let it pass to handler

        int perHeatN = match.PlayerCount;
        var rounds = command.Rounds;

        return perHeatN == 2 ? ValidateN2Rounds(rounds) : ValidateNGreater2Rounds(rounds, perHeatN);
    }

    private static bool ValidateN2Rounds(IList<RoundDto> rounds)
    {
        // No partial fill: each round must be fully filled or fully empty
        if (rounds.Any(r =>
            (string.IsNullOrEmpty(r.WinnerUserId) || string.IsNullOrEmpty(r.PlayerOneCharacterId) || string.IsNullOrEmpty(r.PlayerTwoCharacterId))
            && !(string.IsNullOrEmpty(r.WinnerUserId) && string.IsNullOrEmpty(r.PlayerOneCharacterId) && string.IsNullOrEmpty(r.PlayerTwoCharacterId))))
            return false;

        // Defense: N=2 must NOT supply placement fields
        if (rounds.Any(r =>
            !string.IsNullOrEmpty(r.SecondPlaceUserId) ||
            !string.IsNullOrEmpty(r.ThirdPlaceUserId) ||
            !string.IsNullOrEmpty(r.FourthPlaceUserId)))
            return false;

        // Must be decisive (majority of rounds played to one player)
        var requiredWins = (int)Math.Ceiling(rounds.Count / 2.0);
        var maxWins = rounds
            .Where(r => !string.IsNullOrEmpty(r.WinnerUserId))
            .GroupBy(r => r.WinnerUserId)
            .Select(g => g.Count())
            .DefaultIfEmpty(0)
            .Max();
        if (maxWins < requiredWins) return false;

        // No character reuse per player within the same match
        return CharacterReuseViolation(rounds) == null;
    }

    private static bool ValidateNGreater2Rounds(IList<RoundDto> rounds, int perHeatN)
    {
        // N>2 matches are single-round
        if (rounds.Count != 1) return false;

        var round = rounds[0];

        // Winner is required for all N>2
        if (string.IsNullOrEmpty(round.WinnerUserId)) return false;

        // N=4: SecondPlaceUserId required for top-2 advancement
        if (perHeatN == 4 && string.IsNullOrEmpty(round.SecondPlaceUserId)) return false;

        // Placement IDs must be distinct (non-null entries only)
        var placements = new[] { round.WinnerUserId, round.SecondPlaceUserId, round.ThirdPlaceUserId, round.FourthPlaceUserId }
            .Where(p => !string.IsNullOrEmpty(p))
            .ToList();
        return placements.Count == placements.Distinct(StringComparer.Ordinal).Count();
    }

    private static string? CharacterReuseViolation(IList<RoundDto> rounds)
    {
        var completedRounds = rounds
            .Where(r => !string.IsNullOrEmpty(r.WinnerUserId))
            .OrderBy(r => r.RoundNumber)
            .ToList();

        var playerOneUsed = new Dictionary<string, int>();
        var playerTwoUsed = new Dictionary<string, int>();

        foreach (var round in completedRounds)
        {
            if (!string.IsNullOrEmpty(round.PlayerOneCharacterId))
            {
                if (playerOneUsed.TryGetValue(round.PlayerOneCharacterId, out var p1PrevRound))
                    return $"Player 1 cannot reuse character (Round {p1PrevRound})";
                playerOneUsed[round.PlayerOneCharacterId] = round.RoundNumber;
            }

            if (!string.IsNullOrEmpty(round.PlayerTwoCharacterId))
            {
                if (playerTwoUsed.TryGetValue(round.PlayerTwoCharacterId, out var p2PrevRound))
                    return $"Player 2 cannot reuse character (Round {p2PrevRound})";
                playerTwoUsed[round.PlayerTwoCharacterId] = round.RoundNumber;
            }
        }

        return null;
    }
}
