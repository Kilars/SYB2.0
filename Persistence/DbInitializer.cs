using System;
using Domain;
using Microsoft.AspNetCore.Identity;

namespace Persistence;

public class DbInitializer
{
    public static async Task SeedData(AppDbContext context, UserManager<User> userManager)
    {
        var characters = AllCharacters.GetCharacterList();
        context.Characters.AddRange(characters);

        var users = SeasonOneLeague.GetUsers();
        if (!userManager.Users.Any())
        {
            foreach (var user in users)
            {
                await userManager.CreateAsync(user, "Pa$$w0rd");
            }
        }

        if (context.Leagues.Any()) return;
        var leagues = SeasonOneLeague.GetSeasonOne();
        context.Leagues.AddRange(leagues);

        await context.SaveChangesAsync();
    }
}
