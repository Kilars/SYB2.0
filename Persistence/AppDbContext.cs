using System;
using Domain;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Persistence;

public class AppDbContext(DbContextOptions options) : IdentityDbContext<User>(options)
{
    public required DbSet<Competition> Competitions { get; set; }
    public required DbSet<League> Leagues { get; set; }
    public required DbSet<Tournament> Tournaments { get; set; }
    public required DbSet<Casual> Casuals { get; set; }
    public required DbSet<CompetitionMember> CompetitionMembers { get; set; }
    public required DbSet<Match> Matches { get; set; }
    public required DbSet<Round> Rounds { get; set; }
    public required DbSet<Character> Characters { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // TPH discriminator for Competition hierarchy
        builder.Entity<Competition>()
            .HasDiscriminator<string>("CompetitionType")
            .HasValue<League>("League")
            .HasValue<Tournament>("Tournament")
            .HasValue<Casual>("Casual");

        // Composite keys
        builder.Entity<CompetitionMember>(x => x.HasKey(m => new { m.UserId, m.CompetitionId }));
        builder.Entity<Match>(x => x.HasKey(m => new { m.CompetitionId, m.BracketNumber, m.MatchNumber }));
        builder.Entity<Round>(x => x.HasKey(m => new { m.CompetitionId, m.BracketNumber, m.MatchNumber, m.RoundNumber }));

        // CompetitionMember relationships
        builder.Entity<CompetitionMember>()
            .HasOne(x => x.User)
            .WithMany(x => x.CompetitionMembers)
            .HasForeignKey(x => x.UserId);

        builder.Entity<CompetitionMember>()
            .HasOne(x => x.Competition)
            .WithMany(x => x.Members)
            .HasForeignKey(x => x.CompetitionId)
            .OnDelete(DeleteBehavior.NoAction);

        // Match → Competition
        builder.Entity<Match>()
            .HasOne(x => x.Competition)
            .WithMany(x => x.Matches)
            .HasForeignKey(x => x.CompetitionId)
            .OnDelete(DeleteBehavior.NoAction);

        // Match → CompetitionMember (PlayerOne/Two)
        builder.Entity<Match>()
            .HasOne(x => x.PlayerOne)
            .WithMany(x => x.MatchesAsPlayerOne)
            .HasForeignKey(x => new { x.PlayerOneUserId, x.CompetitionId })
            .IsRequired(false)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<Match>()
            .HasOne(x => x.PlayerTwo)
            .WithMany(x => x.MatchesAsPlayerTwo)
            .HasForeignKey(x => new { x.PlayerTwoUserId, x.CompetitionId })
            .IsRequired(false)
            .OnDelete(DeleteBehavior.NoAction);

        // Round → Match
        builder.Entity<Round>()
            .HasOne(x => x.Match)
            .WithMany(x => x.Rounds)
            .HasForeignKey(x => new { x.CompetitionId, x.BracketNumber, x.MatchNumber })
            .OnDelete(DeleteBehavior.NoAction);

        // Round → Character
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
