using Application.Core;
using Domain;
using MediatR;
using Persistence;

namespace Application.Guests.Commands;

public class CreateGuest
{
    public class Command : IRequest<Result<UserDto>>
    {
        public required string DisplayName { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command, Result<UserDto>>
    {
        public async Task<Result<UserDto>> Handle(Command request, CancellationToken cancellationToken)
        {
            var user = new User
            {
                Id = Guid.NewGuid().ToString(),
                DisplayName = request.DisplayName,
                UserName = $"guest_{Guid.NewGuid()}",
                IsGuest = true
            };
            user.NormalizedUserName = user.UserName.ToUpperInvariant();

            context.Users.Add(user);
            var result = await context.SaveChangesAsync(cancellationToken) > 0;

            if (!result) return Result<UserDto>.Failure("Failed to create guest user", 400);

            return Result<UserDto>.Success(new UserDto
            {
                Id = user.Id,
                DisplayName = user.DisplayName!,
                ImageUrl = user.ImageUrl ?? "",
                IsGuest = user.IsGuest
            });
        }
    }
}
