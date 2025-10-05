using System;
using Domain;

namespace Persistence;

public class SeasonOneLeague
{
    public static League GetSeasonOne()
    {
        var matches = GetMatches();
        var league = new League
        {
            Id = "season-one-league-id",
            Title = "Syb Season One",
            Description = "epic! Ble spilt V23/H24",
            Status = LeagueStatus.Active,
            Members = [.. GetUsers().Select(u => new LeagueMember
            {
                UserId = u.Id,
                DisplayName = u.DisplayName!
            })],
            StartDate = new DateTime(2023, 11, 10),
            Matches = matches
        };

        return league;
    }
    public static List<Match> GetMatches()
    {
        var leagueId = "season-one-league-id";
        var split = 1;
        var matchesCore = GetMatchesCore();
        var matches = matchesCore.Select((mc, index) => new Match
        {
            LeagueId = leagueId,
            Completed = true,
            PlayerOneUserId = mc.P1,
            PlayerOneLeagueId = leagueId,
            PlayerTwoUserId = mc.P2,
            PlayerTwoLeagueId = leagueId,
            WinnerUserId = mc.W,
            Split = split,
            MatchIndex = index + 1,
            RegisteredTime = DateTime.UtcNow,
            Rounds = [.. mc.R.Select((r, roundIndex) => new Round
            {
                LeagueId = leagueId,
                MatchIndex = index + 1,
                Split = split,
                RoundNumber = roundIndex + 1,
                PlayerOneCharacterId = r.Item1,
                PlayerTwoCharacterId = r.Item2,
                WinnerUserId = r.Item3,
                Completed = true
            })]
        }).ToList();

        return matches;
    }
    public class MatchCore
    {
        public required string P1 { get; set; }
        public required string P2 { get; set; }
        public required string W { get; set; }
        public required (string, string, string)[] R { get; set; } // (char1, char2, winner)
    }
    public static List<MatchCore> GetMatchesCore()
    {
        // Each match: p1 = player one, p2 = player two, w = winner, r = rounds (array of tuples)
        var matches = new List<MatchCore>
        {
            new() {
                P1 = "matias",
                P2 = "bh",
                W = "matias",
                R = [
                    ("king_k_rool", "samus", "matias"),
                    ("ness", "villager", "matias"),
                ]
            },
            new() {
                P1 = "hansemann",
                P2 = "denix",
                W = "denix",
                R = [
                    ("yoshi", "king_k_rool", "denix"),
                    ("ness", "hero", "denix"),
                ]
            },
            new() {
                P1 = "hansemann",
                P2 = "larsski",
                W = "hansemann",
                R = [
                    ("yoshi", "pyra_mythra", "king_k_rool"),
                    ("incineroar", "joker", "hansemann"),
                    ("ness", "king_k_rool", "hansemann"),
                ]
            },
            new() {
                P1 = "hansemann",
                P2 = "bennern",
                W = "hansemann",
                R = [
                    ("yoshi", "zelda", "hansemann"),
                    ("ness", "inkling", "hansemann"),
                ]
            },
            new() {
                P1 = "bennern",
                P2 = "bh",
                W = "bh",
                R = [
                    ("villager", "samus", "bh"),
                    ("inkling", "villager", "bennern"),
                    ("bowser_jr", "dark_pit", "bh"),
                ]
            },
            new() {
                P1 = "denix",
                P2 = "bennern",
                W = "denix",
                R = [
                    ("king_k_rool", "inkling", "bennern"),
                    ("incineroar", "peach", "denix"),
                    ("hero", "mario", "denix"),
                ]
            },
            new() {
                P1 = "timmeehh",
                P2 = "bennern",
                W = "bennern",
                R = [
                    ("villager", "min_mon", "bennern"),
                    ("link", "bowser_jr", "bennern"),
                ]
            },
            new() {
                P1 = "timmeehh",
                P2 = "denix",
                W = "denix",
                R = [
                    ("min_min", "incineroar", "timmeehh"),
                    ("byleth", "king_k_rool", "denix"),
                    ("sora", "hero", "denix"),
                ]
            },
            new() {
                P1 = "sander",
                P2 = "bennern",
                W = "bennern",
                R = [
                    ("byleth", "inling", "bennern"),
                    ("luigi", "zelda", "sander"),
                    ("ness", "king_dededede", "bennern"),
                ]
            },
            new() {
                P1 = "timmeehh",
                P2 = "larsski",
                W = "timmeehh",
                R = [
                    ("min_min", "pyra_mythra", "timmeehh"),
                    ("byleth", "joker", "larsski"),
                    ("sora", "captain_falcon", "timmeehh"),
                ]
            },
            //10+ vvv
            new() {
                P1 = "eirik",
                P2 = "oliver",
                W = "oliver",
                R = [
                    ("sephiroth", "duck_hunt_duo", "oliver"),
                    ("ridley", "sora", "eirik"),
                    ("palutena", "joker", "oliver"),
                ]
            },
            new() {
                P1 = "sander",
                P2 = "oliver",
                W = "oliver",
                R = [
                    ("byleth", "joker", "oliver"),
                    ("toon_link", "duck_hunt_duo", "oliver"),
                ]
            },
            new() {
                P1 = "sander",
                P2 = "cpu",
                W = "sander",
                R = [
                    ("byleth", "dede", "sander"),
                    ("donkey_kong", "dede", "cpu"),
                    ("corrin", "dede", "sander"),
                ]
            },
            new() {
                P1 = "denix",
                P2 = "larsski",
                W = "denix",
                R = [
                    ("king_k_rool", "captain_falcon", "denix"),
                    ("incineroar", "joker", "denix"),
                ]
            },
            new() {
                P1 = "sander",
                P2 = "larsski",
                W = "sander",
                R = [
                    ("byleth", "joker", "sander"),
                    ("luigi", "pyra_mythra", "sander"),
                ]
            },
            new() {
                P1 = "timmeehh",
                P2 = "cpu",
                W = "timmeehh",
                R = [
                    ("min_min", "dede", "cpu"),
                    ("byleth", "dede", "timmeeh"),
                    ("link", "dede", "timmeeh"),
                ]
            },
            new() {
                P1 = "matias",
                P2 = "cpu",
                W = "matias",
                R = [
                    ("king_k_rool", "dede", "matias"),
                    ("piranha_plant", "plant", "matias"),
                ]
            },
            new() {
                P1 = "eirik",
                P2 = "cpu",
                W = "eirik",
                R = [
                    ("palutena", "dede", "eirik"),
                    ("ridley", "plant", "eirik"),
                ]
            },
            new() {
                P1 = "denix",
                P2 = "oliver",
                W = "oliver",
                R = [
                    ("hero", "joker", "denix"),
                    ("king_k_rool", "duck_hunt_do", "denix"),
                ]
            },
            new() {
                P1 = "eirik",
                P2 = "matias",
                W = "eirik",
                R = [
                    ("palutena", "dark_samus", "eirik"),
                    ("isabelle", "ness", "eirik"),
                ]
            },
            //20+ vv
            new() {
                P1 = "matias",
                P2 = "larsski",
                W = "larsski",
                R = [
                    ("king_k_rool", "joker", "matias"),
                    ("incineroar", "captain_falconk", "larsski"),
                    ("piranha_plant", "pyra_mythra", "larsski"),
                ]
            },
            new() {
                P1 = "denix",
                P2 = "bh",
                W = "denix",
                R = [
                    ("king_k_rool", "incineroar", "denix"),
                    ("hero", "dark_samus", "bh"),
                    ("incineroar", "dark_pit", "denix"),
                ]
            },
            new() {
                P1 = "larsengstad",
                P2 = "cpu",
                W = "larsengstad",
                R = [
                    ("link", "dede", "larsengstad"),
                    ("donkey_kong", "dede", "larsengstad"),
                ]
            },
            new() {
                P1 = "eirik",
                P2 = "bh",
                W = "eirik",
                R = [
                    ("ridley", "samus", "eirik"),
                    ("sephiroth", "cloud", "eirik"),
                ]
            },
            new() {
                P1 = "timmeehh",
                P2 = "larsengstad",
                W = "larsengstad",
                R = [
                    ("min_min", "wii_fit_trainer", "timmeehh"),
                    ("byleth", "captain_falcon", "larsengstad"),
                    ("link", "piranha_plant", "larsengstad"),
                ]
            },
            new() {
                P1 = "timmeehh",
                P2 = "bh",
                W = "bh",
                R = [
                    ("byleth", "samus", "bh"),
                    ("min_min", "cloud", "timmeeh"),
                    ("ganondorf", "incineroar", "bh"),
                ]
            },
            new() {
                P1 = "larsengstad",
                P2 = "bh",
                W = "bh",
                R = [
                    ("isabelle", "dark_pit", "bh"),
                    ("piranha_plant", "samus", "bh"),
                ]
            },
            new() {
                P1 = "timmeehh",
                P2 = "sander",
                W = "sander",
                R = [
                    ("ganondorf", "byleth", "sander"),
                    ("min_min", "robin", "timmeeh"),
                    ("sora", "donkey_kong", "sander"),
                ]
            },
            new() {
                P1 = "hansemann",
                P2 = "timmeehh",
                W = "hansemann",
                R = [
                    ("yoshi", "min_min", "hansemann"),
                    ("ness", "captain_falcon", "hansemann"),
                ]
            },
            new() {
                P1 = "eirik",
                P2 = "larsengstad",
                W = "eirik",
                R = [
                    ("sephiroth", "captain_falcon", "eirik"),
                    ("ridley", "link", "eirik"),
                ]
            },
            //30+ vv
        };
        return matches;
    }
    public static List<User> GetUsers()
    {
        return
        [
            new() { Id = "denix", DisplayName = "Denix", UserName = "denix@test.com", Email = "denix@test.com" },
            new() { Id = "eirik", DisplayName = "Eirik", UserName = "eirik@test.com", Email = "eirik@test.com" },
            new() { Id = "hansemann", DisplayName = "Hansemann", UserName = "hansemann@test.com", Email = "hansemann@test.com" },
            new() { Id = "sander", DisplayName = "Sander", UserName = "sander@test.com", Email = "sander@test.com" },
            new() { Id = "oliver", DisplayName = "Oliver", UserName = "oliver@test.com", Email = "oliver@test.com" },
            new() { Id = "larsengstad", DisplayName = "Larsengstad", UserName = "larsengstad@test.com", Email = "larsengstad@test.com" },
            new() { Id = "matias", DisplayName = "Matias", UserName = "matias@test.com", Email = "matias@test.com" },
            new() { Id = "bh", DisplayName = "Bh", UserName = "bh@test.com", Email = "bh@test.com" },
            new() { Id = "timmeehh", DisplayName = "Timmeehh", UserName = "timmeehh@test.com", Email = "timmeehh@test.com" },
            new() { Id = "bennern", DisplayName = "Bennern", UserName = "bennern@test.com", Email = "bennern@test.com" },
            new() { Id = "larsski", DisplayName = "Larsski", UserName = "larsski@test.com", Email = "larsski@test.com" },
            new() { Id = "cpu", DisplayName = "CPU-LVL-9", UserName = "cpu@test.com", Email = "cpu@test.com" },
        ];
    }

}
