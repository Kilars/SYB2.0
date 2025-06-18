using System;
using Domain;
using MediatR;
using Persistence;

namespace Application.Leagues.Commands;

public class CreateLeague
{
    public class Command : IRequest<string>
    {
        public required League League { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command, string>
    {
        public async Task<string> Handle(Command request, CancellationToken cancellationToken)
        {
            context.Leagues.Add(request.League);

            var res = await context.SaveChangesAsync(cancellationToken) > 0;

            if (!res) throw new Exception("Failed to create leaderboard");

            return request.League.Id;
        }
    }
}
