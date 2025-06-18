using System;
using Domain;
using Microsoft.EntityFrameworkCore;

namespace Persistence;

public class AppDbContext(DbContextOptions options) : DbContext(options)
{
    public required DbSet<League> Leagues { get; set; }
    public required DbSet<LeagueMember> LeagueMembers { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<LeagueMember>()
            .HasOne(x => x.League)
            .WithMany(x => x.Members)
            .HasForeignKey(x => x.LeagueId);
    }
}
