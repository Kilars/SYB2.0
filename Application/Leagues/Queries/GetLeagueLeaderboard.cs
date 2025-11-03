using System;
using System.ComponentModel;
using Application.Core;
using Application.Leagues.DTOs;
using AutoMapper;
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
                .Where(m => m.LeagueId == request.Id && !string.IsNullOrEmpty(m.WinnerUserId))
                .Include(x => x.PlayerOne)
                .Include(x => x.PlayerOne!.User)
                .Include(x => x.PlayerTwo)
                .Include(x => x.PlayerTwo!.User)
                .Include(x => x.Rounds)
                .ToListAsync(cancellationToken: cancellationToken);

            var leaderboardUsersTwo = matches
                .SelectMany(m => new[] {
                    new {
                        m.PlayerOne!.User.DisplayName,
                        IsWin = m.WinnerUserId == m.PlayerOne.UserId,
                        IsLoss = m.WinnerUserId == m.PlayerTwo!.UserId,
                        IsFlawless = m.WinnerUserId == m.PlayerOne.UserId && (m.Rounds.Where(r => !string.IsNullOrEmpty(r.WinnerUserId)).Count() == 2)
                    },
                    new {
                        m.PlayerTwo!.User.DisplayName,
                        IsWin = m.WinnerUserId == m.PlayerTwo.UserId,
                        IsLoss = m.WinnerUserId == m.PlayerOne.UserId,
                        IsFlawless = m.WinnerUserId == m.PlayerTwo.UserId && (m.Rounds.Where(r => !string.IsNullOrEmpty(r.WinnerUserId)).Count() == 2)
                    }
                })
                .GroupBy(m => m.DisplayName)
                .ToList();

            var leaderboardUsers = matches
                .SelectMany(m => new[] {
                    new {
                        m.PlayerOne!.User.DisplayName,
                        IsWin = m.WinnerUserId == m.PlayerOne.UserId,
                        IsLoss = m.WinnerUserId == m.PlayerTwo!.UserId,
                        IsFlawless = m.WinnerUserId == m.PlayerOne.UserId && (m.Rounds.Where(r => !string.IsNullOrEmpty(r.WinnerUserId)).Count() == 2)
                    },
                    new {
                        m.PlayerTwo!.User.DisplayName,
                        IsWin = m.WinnerUserId == m.PlayerTwo.UserId,
                        IsLoss = m.WinnerUserId == m.PlayerOne.UserId,
                        IsFlawless = m.WinnerUserId == m.PlayerTwo.UserId && (m.Rounds.Where(r => !string.IsNullOrEmpty(r.WinnerUserId)).Count() == 2)
                    }
                })
                .GroupBy(m => m.DisplayName)
                .Select(g => new LeaderboardUser
                {
                    DisplayName = g.Key!,
                    Wins = g.Where(ml => ml.IsWin).Count(),
                    Losses = g.Where(ml => ml.IsLoss).Count(),
                    Flawless = g.Where(ml => ml.IsFlawless).Count(),
                    Points = g.Where(ml => ml.IsWin).Count() * 4 + g.Where(ml => ml.IsFlawless).Count()
                })
                .OrderByDescending(lm => lm.Points)
                .ToList();

            return Result<List<LeaderboardUser>>.Success(leaderboardUsers);
        }
    }
}
