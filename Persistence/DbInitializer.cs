using System;
using Domain;
using Microsoft.AspNetCore.Identity;

namespace Persistence;

public class DbInitializer
{
    public static async Task SeedData(AppDbContext context, UserManager<User> userManager)
    {
        var users = new List<User>
        {
            new() { Id = "bob-id", DisplayName = "Bob", UserName = "bob@test.com", Email = "bob@test.com" },
            new() { Id = "tom-id", DisplayName = "Tom", UserName = "tom@test.com", Email = "tom@test.com" },
            new() { Id = "jane-id",  DisplayName = "Jane", UserName = "jane@test.com", Email = "jane@test.com" },
        };

        if (!userManager.Users.Any())
        {
            foreach (var user in users)
            {
                await userManager.CreateAsync(user, "Pa$$w0rd");
            }
        }

        if (context.Leagues.Any()) return;
        var leagues = new List<League>
        {
            new() {
            Title = "Spring Showdown",
            Description = "A competitive league to kick off the spring season.",
            Status = LeagueStatus.Planned,
            StartDate = new DateTime(2025, 3, 1),
            EndDate = new DateTime(2025, 5, 1),
            Members = [
                new() { UserId = "bob-id", DisplayName = "Bob", IsAdmin = true },
                new() { UserId = "tom-id", DisplayName = "Tom", IsAdmin = false },
                new() { UserId = "jane-id", DisplayName = "Jane", IsAdmin = false },
            ]
        },
        new() {
            Title = "Summer Slam",
            Description = "High-intensity summer matchups for experienced players.",
            Status = LeagueStatus.Active,
            StartDate = new DateTime(2025, 6, 1),
            Members = [
                new() { UserId = "bob-id", DisplayName = "Bob", IsAdmin = true },
                new() { UserId = "jane-id", DisplayName = "Jane", IsAdmin = false },
            ]
        },
        new() {
            Title = "Autumn Arena",
            Description = "Casual but spirited competition for all skill levels.",
            Status = LeagueStatus.Complete,
            StartDate = new DateTime(2024, 9, 1),
            Members = [
                new() { UserId = "tom-id", DisplayName = "Tom", IsAdmin = true },
                new() { UserId = "jane-id", DisplayName = "Jane", IsAdmin = false },
            ]
        }
        };
        context.Leagues.AddRange(leagues);

        await context.SaveChangesAsync();
    }
}
