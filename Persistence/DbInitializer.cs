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
            StartDate = DateTime.Now.AddDays(7),
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
            StartDate = DateTime.Now.AddMonths(2),
            Members = [
                new() { UserId = "bob-id", DisplayName = "Bob", IsAdmin = true },
                new() { UserId = "jane-id", DisplayName = "Jane", IsAdmin = false },
            ]
        },
        new() {
            Title = "Autumn Arena",
            Description = "Casual but spirited competition for all skill levels.",
            Status = LeagueStatus.Complete,
            StartDate = DateTime.Now.AddMonths(3),
            Members = [
                new() { UserId = "tom-id", DisplayName = "Tom", IsAdmin = true },
                new() { UserId = "jane-id", DisplayName = "Jane", IsAdmin = false },
            ]
        }
        };
        context.Leagues.AddRange(leagues);

        var characters = new List<Character>()
        {
            new() {
                FullName = "Zero Suit Samus",
                ShorthandName = "ZSS",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174165/WmVyb19zdWl0X3NhbXVzX2dmZ21jbw==/drilldown"
            },
            new() {
                FullName = "Zelda",
                ShorthandName = "zelda",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174160/WmVsZGFfbTN6dzV0/drilldown"
            },
            new() {
                FullName = "Young Link",
                ShorthandName = "Young Link",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174160/WW91bmdfTGlua193dWVmMDU=/drilldown"
            },
            new() {
                FullName = "Wolf",
                ShorthandName = "Wolf",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174159/V29sZl9oeWZwNWk=/drilldown"
            },
            new() {
                FullName = "Yoshi",
                ShorthandName = "Yoshi",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174159/WW9zaGlfZWxmdHRz/drilldown"
            },
            new() {
                FullName = "Wario",
                ShorthandName = "Wario",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174159/V2FyaW9fcWE2cnZq/drilldown"
            },
            new() {
                FullName = "Wii fit trainer",
                ShorthandName = "Wii",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174159/V2lpX2ZpdF90cmFpbmVyX3kyMmFhcA==/drilldown"
            },
            new() {
                FullName = "Sora",
                ShorthandName = "Sora",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174153/U29yYV9iem1nNXk=/drilldown"
            },
            new() {
                FullName = "Villager",
                ShorthandName = "Villager",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174153/VmlsbGFnZXJfY3lvcGpo/drilldown"
            },
            new() {
                FullName = "Toon Link",
                ShorthandName = "Toon Link",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174153/VG9vbl9MaW5rX2NzdzFibg==/drilldown"
            },
            new() {
                FullName = "Wario",
                ShorthandName = "Wario",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174159/V2FyaW9fcWE2cnZq/drilldown"
            },
            new() {
                FullName = "Terry",
                ShorthandName = "Terry",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174152/VGVycnlfd255YWcx/drilldown"
            },
            new() {
                FullName = "Steve",
                ShorthandName = "Steve",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174152/U3RldmVfYTlpb2xt/drilldown"
            },
            new() {
                FullName = "Sonic",
                ShorthandName = "Sonic",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174152/U29uaWNfZXV6aWZz/drilldown"
            },
            new() {
                FullName = "Snake",
                ShorthandName = "Snake",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174152/U25ha2Vfd3Bidm9p/drilldown"
            },
            new() {
                FullName = "Simon",
                ShorthandName = "Simon",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174152/U2ltb25fbGp4YmRm/drilldown"
            },
            new() {
                FullName = "Sheik",
                ShorthandName = "Sheik",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174146/U2hlaWtfaGZpdWxy/drilldown"
            },
            new() {
                FullName = "Shulk",
                ShorthandName = "Shulk",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174146/U2h1bGtfenVlbndh/drilldown"
            },
            new() {
                FullName = "Sheik",
                ShorthandName = "Sheik",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174146/U2hlaWtfaGZpdWxy/drilldown"
            },
            new() {
                FullName = "Sephiroth",
                ShorthandName = "Sephiroth",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174146/U2VwaGlyb3RoX2h5dWtodw==/drilldown"
            },
            new() {
                FullName = "Samus",
                ShorthandName = "Samus",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174146/U2FtdXNfaGRiNXpm/drilldown"
            },
            new() {
                FullName = "Ryu",
                ShorthandName = "Ryu",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174145/Unl1X3B5OGVlaQ==/drilldown"
            },
            new() {
                FullName = "Roy",
                ShorthandName = "Roy",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174145/Um95X2ZrcHpiMA==/drilldown"
            },
            new() {
                FullName = "Rosalina & Luma",
                ShorthandName = "Rosalina",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174139/Um9zYWxpbmFfYW5kX2x1bWFfbGVsYnR3/drilldown"
            },
            new() {
                FullName = "Rob",
                ShorthandName = "Rob",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174139/Um9iX3prY2hsbw==/drilldown"
            },
            new() {
                FullName = "Robin",
                ShorthandName = "Robin",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174139/Um9iaW5feXNxY2xs/drilldown"
            },
            new() {
                FullName = "Ridley",
                ShorthandName = "Ridley",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174139/UmlkbGV5X29xZXNwaQ==/drilldown"
            },
            new() {
                FullName = "Richter",
                ShorthandName = "Richter",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174139/UmljaHRlcl9qYmJkdGU=/drilldown"
            },
            new() {
                FullName = "Pyra (& mythra)",
                ShorthandName = "Pyra",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174138/UHlyYV9ib21xZXc=/drilldown"
            },
            new() {
                FullName = "Pit",
                ShorthandName = "Pit",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174138/UGl0X3NlbTdteA==/drilldown"
            },
            new() {
                FullName = "Pirhana Plant",
                ShorthandName = "Pirhana",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174138/UGlyYW5oYV9QbGFudF9kZGluZno=/drilldown"
            },
            new() {
                FullName = "Palutena",
                ShorthandName = "Palutena",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174131/UGFsdXRlbmFfdmJyYzl6/drilldown"
            },
            new() {
                FullName = "Pikachu",
                ShorthandName = "Pikachu",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174131/UGlrYWNodV9sbXJlb3U=/drilldown"
            },
            new() {
                FullName = "Pichu",
                ShorthandName = "Pichu",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174131/UGljaHVfeWdxOXo5/drilldown"
            },
            new() {
                FullName = "Peach",
                ShorthandName = "Peach",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174130/UGVhY2hfZ2puZmxo/drilldown"
            },
            new() {
                FullName = "Olimar",
                ShorthandName = "Olimar",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174129/T2xpbWFyX3EzaWptcw==/drilldown"
            },
            new() {
                FullName = "Pac Man",
                ShorthandName = "Pac Man",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174129/UGFjX01hbl9nenJ5MGI=/drilldown"
            },
            new() {
                FullName = "Min Min",
                ShorthandName = "Min Min",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174129/TWluX01pbl9oMWgxcjE=/drilldown"
            },
            new() {
                FullName = "Ness",
                ShorthandName = "Ness",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174129/TmVzc19iNDQ4ano=/drilldown"
            },
            new() {
                FullName = "Mr. Game & Watch",
                ShorthandName = "Mr. Game",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174129/TXJfZ2FtZV9hbmRfd2F0Y2hfeXl0c2Ri/drilldown"
            },
            new() {
                FullName = "Mewtwo",
                ShorthandName = "Mewtwo",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174122/TWV3dHdvX3ZzaHZ2dg==/drilldown"
            },
            new() {
                FullName = "Meta Knight",
                ShorthandName = "Meta Knight",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174122/TWV0YV9LbmlnaHRfZmUxaGxm/drilldown"
            },
            new() {
                FullName = "Mega Man",
                ShorthandName = "Mega Man",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174122/TWVnYV9NYW5fbHkzdDhm/drilldown"
            },
            new() {
                FullName = "Marth",
                ShorthandName = "Marth",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174122/TWFydGhfZnI5cHJ2/drilldown"
            },
            new() {
                FullName = "Mario",
                ShorthandName = "Mario",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174121/TWFyaW9famIyZjlq/drilldown"
            },
            new() {
                FullName = "Luigi",
                ShorthandName = "Luigi",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174115/THVpZ2lfYnNweXJo/drilldown"
            },
            new() {
                FullName = "Lucas",
                ShorthandName = "Lucas",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174114/THVjYXNfZmcwamt2/drilldown"
            },
            new() {
                FullName = "Lucina",
                ShorthandName = "Lucina",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174114/THVjaW5hX2NocHY5cg==/drilldown"
            },
            new() {
                FullName = "Lucario",
                ShorthandName = "Lucario",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174114/THVjYXJpb19od2tudGo=/drilldown"
            },
            new() {
                FullName = "Little Mac",
                ShorthandName = "Little Mac",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174114/TGl0dGxlX01hY192ZnFvcnM=/drilldown"
            },
            new() {
                FullName = "Link",
                ShorthandName = "Link",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174114/TGlua19la2lrZm0=/drilldown"
            },
            new() {
                FullName = "King Dededede",
                ShorthandName = "King Dedede",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174113/S2luZ19EZWRlZGVfZ3N4bnh1/drilldown"
            },
            new() {
                FullName = "Kirby",
                ShorthandName = "Kirby",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174113/S2lyYnlfdWJ3cnNy/drilldown"
            },
            new() {
                FullName = "King K Rool",
                ShorthandName = "King K Rool",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174113/S2luZ19LX1Jvb2xfeWJodG9t/drilldown"
            },
            new() {
                FullName = "Ken",
                ShorthandName = "Ken",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174113/S2VuX21kOHIycA==/drilldown"
            },
            new() {
                FullName = "Kazuya",
                ShorthandName = "Kazuya",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174108/S2F6dXlhX3BrZHpvcw==/drilldown"
            },
            new() {
                FullName = "Inkling",
                ShorthandName = "Inkling",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174108/SW5rbGluZ19yZ3dhOWk=/drilldown"
            },
            new() {
                FullName = "Joker",
                ShorthandName = "Joker",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174108/Sm9rZXJfdXlqemJy/drilldown"
            },
            new() {
                FullName = "Jigglypuff",
                ShorthandName = "Jigglypuff",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174107/SmlnZ2x5cHVmZl9oeXNwaGY=/drilldown"
            },
            new() {
                FullName = "Isabelle",
                ShorthandName = "Isabelle",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174107/SXNhYmVsbGVfdWN1eXdv/drilldown"
            },
            new() {
                FullName = "Inkling",
                ShorthandName = "Inkling",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174108/SW5rbGluZ19yZ3dhOWk=/drilldown"
            },
            new() {
                FullName = "Ike",
                ShorthandName = "Ike",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174107/SWtlX3RuMG56cA==/drilldown"
            },
            new() {
                FullName = "Incineroar",
                ShorthandName = "Incineroar",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174107/SW5jaW5lcm9hcl93NmRianI=/drilldown"
            },
            new() {
                FullName = "Ice Climbers",
                ShorthandName = "Ice Climbers",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174107/SWNlX0NsaW1iZXJzX2NxZHpraw==/drilldown"
            },
            new() {
                FullName = "Ganondorf",
                ShorthandName = "Ganondorf",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174102/R2Fub25kb3JmX2MzejBmZQ==/drilldown"
            },
            new() {
                FullName = "Hero",
                ShorthandName = "Hero",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174102/SGVyb19hMzRjbHo=/drilldown"
            },
            new() {
                FullName = "Greninja",
                ShorthandName = "Greninja",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174102/R3JlbmluamFfZXRnOGtz/drilldown"
            },
            new() {
                FullName = "Fox",
                ShorthandName = "Fox",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174102/Rm94X3dsc3lidA==/drilldown"
            },
            new() {
                FullName = "Falco",
                ShorthandName = "Falco",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174101/RmFsY29fYXVnaGdq/drilldown"
            },
            new() {
                FullName = "Duck Hunt Duo",
                ShorthandName = "Duck Hunt",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174101/RHVja19IdW50X3Rwa3ZpaA==/drilldown"
            },
            new() {
                FullName = "Dr. Mario",
                ShorthandName = "Dr. Mario",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174101/RHJfTWFyaW9fZWMzOHVv/drilldown"
            },
            new() {
                FullName = "Daisy",
                ShorthandName = "Daisy",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174093/RGFpc3lfeGoyeHFy/drilldown"
            },
            new() {
                FullName = "Diddy Kong",
                ShorthandName = "Diddy Kong",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174093/RGlkZHlfS29uZ19ueGFhanA=/drilldown"
            },
            new() {
                FullName = "Donkey Kong",
                ShorthandName = "Donkey Kong",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174093/RG9ua2V5X0tvbmdfdXhlcmph/drilldown"
            },
            new() {
                FullName = "Dark Samus",
                ShorthandName = "Dark Samus",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174093/RGFya19TYW11c190bTM1cWc=/drilldown"
            },
            new() {
                FullName = "Corrin",
                ShorthandName = "Corrin",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174092/Q29ycmluX2UxdGE2dA==/drilldown"
            },
            new() {
                FullName = "Dark Pit",
                ShorthandName = "Dark Pit",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174092/RGFya19QaXRfcm93Mm5j/drilldown"
            },
            new() {
                FullName = "Cloud",
                ShorthandName = "Cloud",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174092/Q2xvdWRfam80M291/drilldown"
            },
            new() {
                FullName = "Byleth",
                ShorthandName = "Byleth",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174092/QnlsZXRoX2x4YXVwcg==/drilldown"
            },
            new() {
                FullName = "Chrom",
                ShorthandName = "Chrom",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174092/Q2hyb21fbTBhcDFu/drilldown"
            },
            new() {
                FullName = "Captain Falcon",
                ShorthandName = "Captain Falcon",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174092/Q2FwdGFpbl9GYWxjb25fbmM1Z2Rw/drilldown"
            },
            new() {
                FullName = "Bayonetta",
                ShorthandName = "Bayonetta",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174092/QmF5b25ldHRhX2Nvcm5waw==/drilldown"
            },
            new() {
                FullName = "Bowser",
                ShorthandName = "Bowser",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174092/Qm93c2VyX3NtbXIwbQ==/drilldown"
            },
            new() {
                FullName = "Banjoo and Kazooie",
                ShorthandName = "Banjoo",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174092/QmFuam9fYW5kX2them9vaWVfa3RraXM4/drilldown"
            },
            new() {
                FullName = "Bowser jr.",
                ShorthandName = "Bowser jr.",
                ImageUrl = "https://res-console.cloudinary.com/dq1en6kue/thumbnails/v1/image/upload/v1759174092/Qm93c2VyX2pyX25xcmxseA==/drilldown"
            },
        };

        context.Characters.AddRange(characters);
        await context.SaveChangesAsync();
    }
}
