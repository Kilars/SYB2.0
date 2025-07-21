using System;
using Application.Interfaces;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Leagues.Commands;

public class ChangeLeagueStatus
{
    public class Command : IRequest<Unit>
    {
        public required string LeagueId { get; set; }
        public required LeagueStatus NewStatus { get; set; }
    }
    public class Handler(AppDbContext context) : IRequestHandler<Command, Unit>
    {
        public async Task<Unit> Handle(Command request, CancellationToken cancellationToken)
        {
            var league = await context.Leagues
                .Include(x => x.Members)
                .FirstOrDefaultAsync(x => x.Id == request.LeagueId, cancellationToken);
            if (league == null) throw new Exception("Not found");

            switch ((league.Status, request.NewStatus))
            {
                case (LeagueStatus.Planned, LeagueStatus.Active):
                    CreateMatchesBetweenAllPlayers(league);
                    league.Status = LeagueStatus.Active;
                    break;

                case (LeagueStatus.Active, LeagueStatus.Complete):
                    //Archive all matches
                    break;
                case (LeagueStatus.Complete, LeagueStatus.Active):
                    //Unarchive all matches
                    break;
                case (LeagueStatus.Active, LeagueStatus.Planned):
                    //Delete all matches and set status to planned
                    context.RemoveRange(context.Matches.Where(m => m.LeagueId == league.Id));
                    league.Status = LeagueStatus.Planned;
                    break;

                default:
                    break;
            }

            var res = await context.SaveChangesAsync(cancellationToken) > 0;

            if (!res) throw new Exception("Could not create matches");
            return Unit.Value;
        }
        private void CreateMatchesBetweenAllPlayers(League league)
        {
            var firstSplit = new List<Match>();
            var secondSplit = new List<Match>();

            var members = league.Members.ToList();

            if (members.Count <= 1) throw new Exception("Cannot make matches for one or less players");

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
                        LeagueId = league.Id,
                        PlayerOneUserId = flip ? p1! : p2!,
                        PlayerOneLeagueId = league.Id,
                        PlayerTwoUserId = flip ? p2! : p1!,
                        PlayerTwoLeagueId = league.Id,
                        Split = 1
                    });

                    secondSplit.Add(new Match
                    {
                        LeagueId = league.Id,
                        PlayerOneUserId = flip ? p2! : p1!,
                        PlayerOneLeagueId = league.Id,
                        PlayerTwoUserId = flip ? p1! : p2!,
                        PlayerTwoLeagueId = league.Id,
                        Split = 2
                    });

                }
            }
            Shuffle(firstSplit);
            Shuffle(secondSplit);

            var index = 1;
            foreach (var match in firstSplit)
            {
                match.MatchIndex = index;
                index++;
            }
            index = 1;
            foreach (var match in secondSplit)
            {
                match.MatchIndex = index;
                index++;
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
