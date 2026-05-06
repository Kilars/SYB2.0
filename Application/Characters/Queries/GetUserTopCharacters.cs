using Application.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Characters.Queries;

public class GetUserTopCharacters
{
    public class Query : IRequest<Result<List<string>>>
    {
        public required string UserId { get; set; }
        public int Count { get; set; } = 5;
    }

    public class Handler(AppDbContext context) : IRequestHandler<Query, Result<List<string>>>
    {
        public async Task<Result<List<string>>> Handle(Query request, CancellationToken cancellationToken)
        {
            var userExists = await context.Users
                .AsNoTracking()
                .AnyAsync(u => u.Id == request.UserId, cancellationToken);

            if (!userExists)
                return Result<List<string>>.Failure("User not found", 404);

            var topCharacterIds = await context.Rounds
                .AsNoTracking()
                .Join(
                    context.Matches,
                    round => new { round.CompetitionId, round.BracketNumber, round.MatchNumber },
                    match => new { match.CompetitionId, match.BracketNumber, match.MatchNumber },
                    (round, match) => new { Round = round, Match = match }
                )
                .Where(x =>
                    (x.Match.PlayerOneUserId == request.UserId && x.Round.PlayerOneCharacterId != null) ||
                    (x.Match.PlayerTwoUserId == request.UserId && x.Round.PlayerTwoCharacterId != null)
                )
                .Select(x => x.Match.PlayerOneUserId == request.UserId
                    ? x.Round.PlayerOneCharacterId
                    : x.Round.PlayerTwoCharacterId)
                .GroupBy(charId => charId)
                .Select(g => new
                {
                    CharacterId = g.Key,
                    Count = g.Count()
                })
                .OrderByDescending(x => x.Count)
                .ThenBy(x => context.Characters
                    .Where(c => c.Id == x.CharacterId)
                    .Select(c => c.FullName)
                    .FirstOrDefault())
                .Take(request.Count)
                .Select(x => x.CharacterId!)
                .ToListAsync(cancellationToken);

            return Result<List<string>>.Success(topCharacterIds);
        }
    }
}
