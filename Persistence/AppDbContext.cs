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
    public required DbSet<Tournament> Tournaments { get; set; }
    public required DbSet<TournamentMember> TournamentMembers { get; set; }
    public required DbSet<TournamentMatch> TournamentMatches { get; set; }
    public required DbSet<TournamentRound> TournamentRounds { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<LeagueMember>(x => x.HasKey(m => new { m.UserId, m.LeagueId }));
        builder.Entity<Match>(x => x.HasKey(m => new { m.LeagueId, m.MatchNumber, m.Split }));
        builder.Entity<Round>(x => x.HasKey(m => new { m.LeagueId, m.MatchNumber, m.Split, m.RoundNumber }));

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
            .HasForeignKey(x => new { x.PlayerOneUserId, x.LeagueId })
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<Match>()
            .HasOne(x => x.PlayerTwo)
            .WithMany(x => x.MatchesAsPlayerTwo)
            .HasForeignKey(x => new { x.PlayerTwoUserId, x.LeagueId })
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<Round>()
            .HasOne(x => x.Match)
            .WithMany(x => x.Rounds)
            .HasForeignKey(x => new { x.LeagueId, x.MatchNumber, x.Split })
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

        // Tournament entities
        builder.Entity<TournamentMember>(x => x.HasKey(m => new { m.UserId, m.TournamentId }));
        builder.Entity<TournamentMatch>(x => x.HasKey(m => new { m.TournamentId, m.MatchNumber }));
        builder.Entity<TournamentRound>(x => x.HasKey(m => new { m.TournamentId, m.MatchNumber, m.RoundNumber }));

        builder.Entity<TournamentMember>()
            .HasOne(x => x.User)
            .WithMany(x => x.TournamentMembers)
            .HasForeignKey(x => x.UserId);

        builder.Entity<TournamentMember>()
            .HasOne(x => x.Tournament)
            .WithMany(x => x.Members)
            .HasForeignKey(x => x.TournamentId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<TournamentMatch>()
            .HasOne(x => x.Tournament)
            .WithMany(x => x.Matches)
            .HasForeignKey(x => x.TournamentId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<TournamentMatch>()
            .HasOne(x => x.PlayerOne)
            .WithMany()
            .HasForeignKey(x => new { x.PlayerOneUserId, x.TournamentId })
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<TournamentMatch>()
            .HasOne(x => x.PlayerTwo)
            .WithMany()
            .HasForeignKey(x => new { x.PlayerTwoUserId, x.TournamentId })
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<TournamentRound>()
            .HasOne(x => x.Match)
            .WithMany(x => x.Rounds)
            .HasForeignKey(x => new { x.TournamentId, x.MatchNumber })
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<TournamentRound>()
            .HasOne(x => x.PlayerOneCharacter)
            .WithMany()
            .HasForeignKey(x => x.PlayerOneCharacterId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<TournamentRound>()
            .HasOne(x => x.PlayerTwoCharacter)
            .WithMany()
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
