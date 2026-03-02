using System;
using System.Collections.ObjectModel;
using Application.Core;
using Application.Interfaces;
using AutoMapper.Execution;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Leagues.Commands;

public class ChangeLeagueStatus
{
    public class Command : IRequest<Result<Unit>>
    {
        public required string LeagueId { get; set; }
        public required CompetitionStatus NewStatus { get; set; }
    }
    public class Handler(AppDbContext context) : IRequestHandler<Command, Result<Unit>>
    {
        public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
            var league = await context.Leagues
                .Include(x => x.Members)
                .FirstOrDefaultAsync(x => x.Id == request.LeagueId, cancellationToken);
            if (league == null) return Result<Unit>.Failure("League not found", 404);
            var members = league.Members.ToList();
            if (members.Count <= 1) return Result<Unit>.Failure("Cannot make status update for one or less players", 400);

            switch ((league.Status, request.NewStatus))
            {
                case (CompetitionStatus.Planned, CompetitionStatus.Active):
                    CreateMatchesBetweenAllPlayers(league);
                    league.Status = CompetitionStatus.Active;
                    break;

                case (CompetitionStatus.Active, CompetitionStatus.Complete):
                    //Archive all matches
                    break;
                case (CompetitionStatus.Complete, CompetitionStatus.Active):
                    //Unarchive all matches
                    break;
                case (CompetitionStatus.Active, CompetitionStatus.Planned):
                    //Delete all rounds first (FK NoAction prevents cascade), then matches
                    context.RemoveRange(context.Rounds.Where(r => r.CompetitionId == league.Id));
                    context.RemoveRange(context.Matches.Where(m => m.CompetitionId == league.Id));
                    league.Status = CompetitionStatus.Planned;
                    break;

                default:
                    break;
            }

            var res = await context.SaveChangesAsync(cancellationToken) > 0;

            if (!res) return Result<Unit>.Failure("Could not change status of league", 400);
            return Result<Unit>.Success(Unit.Value);
        }
        private void CreateMatchesBetweenAllPlayers(League league)
        {
            var firstSplit = new List<Match>();
            var secondSplit = new List<Match>();

            var members = league.Members.ToList();

            // Generate unique pairings (combinations) of players
            for (int i = 0; i < members.Count; i++)
            {
                for (int j = i + 1; j < members.Count; j++)
                {
                    var p1 = members[i].UserId;
                    var p2 = members[j].UserId;

                    // Randomize who goes first in which split for balance
                    bool flip = (i + j) % 2 == 0;

                    firstSplit.Add(new Match
                    {
                        CompetitionId = league.Id,
                        PlayerOneUserId = flip ? p1! : p2!,
                        PlayerTwoUserId = flip ? p2! : p1!,
                        BracketNumber = 1
                    });

                    secondSplit.Add(new Match
                    {
                        CompetitionId = league.Id,
                        PlayerOneUserId = flip ? p2! : p1!,
                        PlayerTwoUserId = flip ? p1! : p2!,
                        BracketNumber = 2
                    });

                }
            }
            Shuffle(firstSplit);
            Shuffle(secondSplit);

            var index = 1;
            foreach (var match in firstSplit)
            {
                match.MatchNumber = index;
                index++;
                for (int i = 0; i < league.BestOf; i++)
                {
                    context.Rounds.Add(new Round
                    {
                        CompetitionId = match.CompetitionId,
                        MatchNumber = match.MatchNumber,
                        BracketNumber = match.BracketNumber,
                        RoundNumber = i + 1
                    });
                }
            }
            index = 1;
            foreach (var match in secondSplit)
            {
                match.MatchNumber = index;
                index++;
                for (int i = 0; i < league.BestOf; i++)
                {
                    context.Rounds.Add(new Round
                    {
                        CompetitionId = match.CompetitionId,
                        MatchNumber = match.MatchNumber,
                        BracketNumber = match.BracketNumber,
                        RoundNumber = i + 1
                    });
                }
            }

            context.Matches.AddRange(firstSplit);
            context.Matches.AddRange(secondSplit);
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
