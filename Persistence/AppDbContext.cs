using System;
using Domain;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Persistence;

public class AppDbContext(DbContextOptions options) : IdentityDbContext<User>(options)
{
    public required DbSet<League> Leagues { get; set; }
    public required DbSet<LeagueMember> LeagueMembers { get; set; }
    public required DbSet<Match> Matches { get; set; }
    public required DbSet<Round> Rounds { get; set; }
    public required DbSet<Character> Characters { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<LeagueMember>(x => x.HasKey(m => new { m.UserId, m.LeagueId }));
        builder.Entity<Match>(x => x.HasKey(m => new { m.LeagueId, m.MatchIndex, m.Split }));
        builder.Entity<Round>(x => x.HasKey(m => new { m.LeagueId, m.MatchIndex, m.Split, m.RoundNumber }));

        builder.Entity<LeagueMember>()
            .HasOne(x => x.User)
            .WithMany(x => x.LeagueMembers)
            .HasForeignKey(x => x.UserId);

        builder.Entity<LeagueMember>()
            .HasOne(x => x.League)
            .WithMany(x => x.Members)
            .HasForeignKey(x => x.LeagueId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<Match>()
            .HasOne(x => x.League)
            .WithMany(x => x.Matches)
            .HasForeignKey(x => x.LeagueId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<Match>()
            .HasOne(x => x.PlayerOne)
            .WithMany(x => x.MatchesAsPlayerOne)
            .HasForeignKey(x => new { x.PlayerOneUserId, x.PlayerOneLeagueId })
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<Match>()
            .HasOne(x => x.PlayerTwo)
            .WithMany(x => x.MatchesAsPlayerTwo)
            .HasForeignKey(x => new { x.PlayerTwoUserId, x.PlayerTwoLeagueId })
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<Round>()
            .HasOne(x => x.Match)
            .WithMany(x => x.Rounds)
            .HasForeignKey(x => new { x.LeagueId, x.MatchIndex, x.Split })
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<Round>()
            .HasOne(x => x.PlayerOneCharacter)
            .WithMany(x => x.RoundsAsPlayerOne)
            .HasForeignKey(x => x.PlayerOneCharacterId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<Round>()
            .HasOne(x => x.PlayerTwoCharacter)
            .WithMany(x => x.RoundsAsPlayerTwo)
            .HasForeignKey(x => x.PlayerTwoCharacterId)
            .OnDelete(DeleteBehavior.NoAction);

        var dateTimeConverter = new ValueConverter<DateTime, DateTime>(
            v => v.ToUniversalTime(),
            v => DateTime.SpecifyKind(v, DateTimeKind.Utc)
        );

        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTime))
                {
                    property.SetValueConverter(dateTimeConverter);
                }

            }

        }
    }
}
