using Application.Common;
using Application.Core;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Leagues.Queries;

public class GetLeagueLeaderboard
{
    public class Query : IRequest<Result<List<LeaderboardUser>>>
    {
        public required string Id { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Query, Result<List<LeaderboardUser>>>
    {
        public async Task<Result<List<LeaderboardUser>>> Handle(Query request, CancellationToken cancellationToken)
        {
            var matches = await context.Matches
                .Where(m => m.CompetitionId == request.Id && !string.IsNullOrEmpty(m.WinnerUserId))
                .Include(x => x.PlayerOne).ThenInclude(p => p!.User)
                .Include(x => x.PlayerTwo).ThenInclude(p => p!.User)
                .Include(x => x.PlayerThree).ThenInclude(p => p!.User)
                .Include(x => x.PlayerFour).ThenInclude(p => p!.User)
                .Include(x => x.Rounds)
                .ToListAsync(cancellationToken);

            var participantRows = matches.SelectMany(m =>
            {
                var rounds = m.Rounds.ToList();

                var participants = new List<(string UserId, string DisplayName, bool IsGuest)>();
                if (m.PlayerOne?.UserId != null)
                    participants.Add((m.PlayerOne.UserId, m.PlayerOne.User.DisplayName!, m.PlayerOne.User.IsGuest));
                if (m.PlayerTwo?.UserId != null)
                    participants.Add((m.PlayerTwo.UserId, m.PlayerTwo.User.DisplayName!, m.PlayerTwo.User.IsGuest));
                if (m.PlayerThree?.UserId != null)
                    participants.Add((m.PlayerThree.UserId, m.PlayerThree.User.DisplayName!, m.PlayerThree.User.IsGuest));
                if (m.PlayerFour?.UserId != null)
                    participants.Add((m.PlayerFour.UserId, m.PlayerFour.User.DisplayName!, m.PlayerFour.User.IsGuest));

                return participants.Select(p =>
                {
                    int pts = PlacementPoints.PointsForParticipant(m, rounds, p.UserId);
                    bool isWin = m.WinnerUserId == p.UserId;
                    bool isLoss = !isWin && !string.IsNullOrEmpty(m.WinnerUserId);

                    int firstCount = 0, secondCount = 0, thirdCount = 0, fourthCount = 0;
                    bool isFlawless = false;

                    if (m.PlayerCount == 2)
                    {
                        isFlawless = isWin && rounds.Count(r => r.WinnerUserId != null) == 2;
                        if (isWin) firstCount = 1;
                        else if (isLoss) secondCount = 1;
                    }
                    else
                    {
                        if (m.WinnerUserId == p.UserId) firstCount = 1;
                        else if (m.SecondPlaceUserId == p.UserId) secondCount = 1;
                        else if (m.ThirdPlaceUserId == p.UserId) thirdCount = 1;
                        else fourthCount = 1;
                    }

                    return new
                    {
                        p.UserId,
                        p.DisplayName,
                        p.IsGuest,
                        Points = pts,
                        IsWin = isWin,
                        IsLoss = isLoss,
                        IsFlawless = isFlawless,
                        FirstCount = firstCount,
                        SecondCount = secondCount,
                        ThirdCount = thirdCount,
                        FourthCount = fourthCount,
                    };
                });
            });

            var leaderboardUsers = participantRows
                .GroupBy(r => r.UserId)
                .Select(g => new LeaderboardUser
                {
                    UserId = g.Key,
                    DisplayName = g.First().DisplayName,
                    IsGuest = g.First().IsGuest,
                    Wins = g.Count(r => r.IsWin),
                    Losses = g.Count(r => r.IsLoss),
                    Flawless = g.Count(r => r.IsFlawless),
                    Points = g.Sum(r => r.Points),
                    FirstPlaceCount = g.Sum(r => r.FirstCount),
                    SecondPlaceCount = g.Sum(r => r.SecondCount),
                    ThirdPlaceCount = g.Sum(r => r.ThirdCount),
                    FourthPlaceCount = g.Sum(r => r.FourthCount),
                })
                .OrderByDescending(lm => lm.Points)
                .ToList();

            return Result<List<LeaderboardUser>>.Success(leaderboardUsers);
        }
    }
}
