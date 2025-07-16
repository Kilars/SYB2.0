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

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<LeagueMember>(x => x.HasKey(m => new { m.UserId, m.LeagueId }));

        builder.Entity<LeagueMember>()
            .HasOne(x => x.User)
            .WithMany(x => x.LeagueMembers)
            .HasForeignKey(x => x.UserId);

        builder.Entity<LeagueMember>()
            .HasOne(x => x.League)
            .WithMany(x => x.Members)
            .HasForeignKey(x => x.LeagueId);

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
