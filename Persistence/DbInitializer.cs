using System;
using Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Persistence;

public class DbInitializer
{
    public static async Task SeedData(AppDbContext context, UserManager<User> userManager)
    {
        if (!context.Characters.Any())
        {
            var characters = AllCharacters.GetCharacterList();
            context.Characters.AddRange(characters);
        }

        var users = SeasonOneLeague.GetUsers();
        if (!userManager.Users.Any())
        {
            foreach (var user in users)
            {
                await userManager.CreateAsync(user, "Pa$$w0rd");
            }
        }

        // Seed global casual competition (ID must match Application.Casual.CasualConstants.GlobalCasualId)
        const string globalCasualId = "casual-global";
        if (!await context.Casuals.AnyAsync(c => c.Id == globalCasualId))
        {
            context.Casuals.Add(new Domain.Casual
            {
                Id = globalCasualId,
                Title = "Casual",
                Description = "Global casual matches",
                Status = CompetitionStatus.Active,
                BestOf = 1,
                StartDate = DateTime.UtcNow
            });
        }

        // Save characters and casual competition before the early return
        await context.SaveChangesAsync();

        if (context.Leagues.Any()) return;
        var leagues = SeasonOneLeague.GetSeasonOne();
        context.Leagues.AddRange(leagues);

        await context.SaveChangesAsync();
    }
}
