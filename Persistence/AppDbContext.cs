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

        // Match → CompetitionMember (PlayerOne/Two/Three/Four)
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

        builder.Entity<Match>()
            .HasOne(x => x.PlayerThree)
            .WithMany(x => x.MatchesAsPlayerThree)
            .HasForeignKey(x => new { x.PlayerThreeUserId, x.CompetitionId })
            .IsRequired(false)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<Match>()
            .HasOne(x => x.PlayerFour)
            .WithMany(x => x.MatchesAsPlayerFour)
            .HasForeignKey(x => new { x.PlayerFourUserId, x.CompetitionId })
            .IsRequired(false)
            .OnDelete(DeleteBehavior.NoAction);

        // Round → Match
        builder.Entity<Round>()
            .HasOne(x => x.Match)
            .WithMany(x => x.Rounds)
            .HasForeignKey(x => new { x.CompetitionId, x.BracketNumber, x.MatchNumber })
            .OnDelete(DeleteBehavior.NoAction);

        // Round → Character (PlayerOne/Two/Three/Four)
        builder.Entity<Round>()
            .HasOne(x => x.PlayerOneCharacter)
            .WithMany(x => x.RoundsAsPlayerOne)
            .HasForeignKey(x => x.PlayerOneCharacterId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<Round>()
            .HasOne(x => x.PlayerTwoCharacter)
            .WithMany(x => x.RoundsAsPlayerTwo)
            .HasForeignKey(x => x.PlayerTwoCharacterId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<Round>()
            .HasOne(x => x.PlayerThreeCharacter)
            .WithMany(x => x.RoundsAsPlayerThree)
            .HasForeignKey(x => x.PlayerThreeCharacterId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<Round>()
            .HasOne(x => x.PlayerFourCharacter)
            .WithMany(x => x.RoundsAsPlayerFour)
            .HasForeignKey(x => x.PlayerFourCharacterId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.NoAction);

        // TPH column disjunction: Tournament.BracketSize and League.PlayerCount map to
        // distinct physical columns to avoid EF colliding both onto the old shared "PlayerCount" column.
        builder.Entity<Tournament>()
            .Property(t => t.BracketSize)
            .HasColumnName("BracketSize");

        // Tournament.PerHeatPlayerCount carries a SQL DEFAULT 2 created by the
        // AddTournamentPerHeatPlayerCount migration (used to backfill pre-existing rows).
        // Mirror it in the model so EF's PendingModelChangesWarning doesn't fire on startup.
        builder.Entity<Tournament>()
            .Property(t => t.PerHeatPlayerCount)
            .HasDefaultValue(2);

        builder.Entity<League>()
            .Property(l => l.PlayerCount)
            .HasColumnName("LeaguePlayerCount");

        // Match.PlayerCount carries a SQL DEFAULT 2 created by the 042 migration
        // (used to backfill pre-existing rows). Mirror it in the model so EF's
        // PendingModelChangesWarning doesn't fire on startup.
        builder.Entity<Match>()
            .Property(m => m.PlayerCount)
            .HasDefaultValue(2);

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
