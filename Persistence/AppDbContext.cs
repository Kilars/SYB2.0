using System;
using Domain;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

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
    }
}
