using System;
using Application.Core;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Tournaments.Commands;

public class StartTournament
{
    public class Command : IRequest<Result<Unit>>
    {
        public required string TournamentId { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            var tournament = await context.Tournaments
                .Include(x => x.Members)
                .Include(x => x.Matches)
                .FirstOrDefaultAsync(x => x.Id == request.TournamentId, cancellationToken);

            if (tournament == null)
                return Result<Unit>.Failure("Tournament not found", 404);

            if (tournament.Status != CompetitionStatus.Planned)
                return Result<Unit>.Failure("Tournament must be in Planned status to start", 400);

            var validCounts = new[] { 4, 8, 16, 32 };
            if (!validCounts.Contains(tournament.Members.Count))
                return Result<Unit>.Failure($"Tournament must have exactly 4, 8, 16, or 32 players to start. Got {tournament.Members.Count}.", 400);

            GenerateBracket(tournament);
            tournament.Status = CompetitionStatus.Active;

            var res = await context.SaveChangesAsync(cancellationToken) > 0;
            return res
                ? Result<Unit>.Success(Unit.Value)
                : Result<Unit>.Failure("Could not start tournament", 400);
        }

        private void GenerateBracket(Tournament tournament)
        {
            // Remove existing matches and rounds if any
            context.RemoveRange(context.Rounds.Where(r => r.CompetitionId == tournament.Id));
            context.RemoveRange(context.Matches.Where(m => m.CompetitionId == tournament.Id));

            var members = tournament.Members.ToList();
            Shuffle(members);

            // Assign seeds based on shuffled order
            for (int i = 0; i < members.Count; i++)
            {
                members[i].Seed = i + 1;
            }

            int playerCount = members.Count;
            int totalRounds = (int)Math.Log2(playerCount);
            int matchNumber = 1;

            // Create first round matches with players
            int firstRoundMatches = playerCount / 2;
            for (int i = 0; i < firstRoundMatches; i++)
            {
                var match = new Match
                {
                    CompetitionId = tournament.Id,
                    BracketNumber = 1,
                    MatchNumber = matchNumber,
                    PlayerOneUserId = members[i * 2].UserId,
                    PlayerTwoUserId = members[i * 2 + 1].UserId,
                };
                context.Matches.Add(match);

                for (int r = 0; r < tournament.BestOf; r++)
                {
                    context.Rounds.Add(new Round
                    {
                        CompetitionId = tournament.Id,
                        BracketNumber = 1,
                        MatchNumber = matchNumber,
                        RoundNumber = r + 1,
                    });
                }
                matchNumber++;
            }

            // Create placeholder matches for subsequent rounds (no players yet)
            for (int round = 2; round <= totalRounds; round++)
            {
                int matchesInRound = playerCount / (int)Math.Pow(2, round);
                for (int i = 0; i < matchesInRound; i++)
                {
                    var match = new Match
                    {
                        CompetitionId = tournament.Id,
                        BracketNumber = round,
                        MatchNumber = matchNumber,
                        PlayerOneUserId = null,
                        PlayerTwoUserId = null,
                    };
                    context.Matches.Add(match);

                    for (int r = 0; r < tournament.BestOf; r++)
                    {
                        context.Rounds.Add(new Round
                        {
                            CompetitionId = tournament.Id,
                            BracketNumber = round,
                            MatchNumber = matchNumber,
                            RoundNumber = r + 1,
                        });
                    }
                    matchNumber++;
                }
            }
        }

        private static void Shuffle<T>(IList<T> list)
        {
            Random rng = new();
            int n = list.Count;
            while (n > 1)
            {
                int k = rng.Next(n--);
                (list[n], list[k]) = (list[k], list[n]);
            }
        }
    }
}
